// Lightweight browser-ready React app (no external icon deps). Uses global React and ReactDOM.
const { useState, useEffect, useCallback, useMemo } = React;

// Simple emoji icons to replace lucide-react for browser demo
const Icon = ({ children, className = '' }) => (
  <span className={className} aria-hidden>
    {children}
  </span>
);

const MapPin = (props) => <Icon {...props}>🗺️</Icon>;
const PlusCircle = (props) => <Icon {...props}>➕</Icon>;
const Settings = (props) => <Icon {...props}>⚙️</Icon>;
const Trash2 = (props) => <Icon {...props}>🗑️</Icon>;
const Loader2 = (props) => <Icon {...props}>⏳</Icon>;
const Search = (props) => <Icon {...props}></Icon>;
const Briefcase = (props) => <Icon {...props}>💼</Icon>;
const ChevronDown = (props) => <Icon {...props}>▾</Icon>;
const Save = (props) => <Icon {...props}>💾</Icon>;
const FileUp = (props) => <Icon {...props}>📤</Icon>;

// --- Helper Components ---
const AccordionItem = ({ state, locations, onDeleteLocation, customFields, onUpdateLocation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
      >
        <h3 className="text-xl font-semibold text-blue-700">
          {state} <span className="text-gray-500 font-normal text-base">({locations.length} {locations.length === 1 ? 'entry' : 'entries'})</span>
        </h3>
        <ChevronDown className={`w-6 h-6 text-blue-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gray-200">
          {locations.map((loc, idx) => (
            <LocationCard key={loc.id} loc={loc} onDeleteLocation={onDeleteLocation} onUpdateLocation={onUpdateLocation} customFields={customFields} style={{ animationDelay: `${idx * 40}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
};



// --- View Locations ---
// ViewLocations lists saved locations with search, sort and grouping by state.
const ViewLocations = ({ locations = [], onDeleteLocation, customFields = [], onUpdateLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [partnerFilter, setPartnerFilter] = useState('');

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    let list = Array.isArray(locations) ? locations.slice() : [];
    // Apply partner type filter
    if (partnerFilter) {
      list = list.filter(l => (l.partnerType || '') === partnerFilter);
    }
    // (LGA filter removed — filtering by LGA is no longer applied)
    if (q) {
      list = list.filter(l => (
        (l.companyName || '').toLowerCase().includes(q) ||
        (l.ownerName || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q)
      ));
    }
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortNewestFirst ? tb - ta : ta - tb;
    });
    return list;
  }, [locations, searchQuery, sortNewestFirst, partnerFilter]);

  const groupedAndFilteredLocations = useMemo(() => {
    return filtered.reduce((acc, loc) => {
      const key = loc.state || 'Unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(loc);
      return acc;
    }, {});
  }, [filtered]);

  const sortedStates = Object.keys(groupedAndFilteredLocations).sort();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center w-full sm:w-1/2">
          <Search className="w-5 h-5 mr-2 text-gray-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search companies, owners, address, email..." className="w-full p-2 border rounded" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Partner:</label>
          <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)} className="p-2 border rounded">
            <option value="">All</option>
            {/* Always include common partner types, plus any others present in locations */}
            {(Array.from(new Set(["FSR", "SLOT", "Independent Agent", ...((locations || []).map(l => l.partnerType).filter(Boolean))]))).map(pt => <option key={pt} value={pt}>{pt}</option>)}
          </select>

          {/* LGA filter removed — no LGA select here anymore */}

          <label className="text-sm text-gray-600">Sort:</label>
          <select value={sortNewestFirst ? 'new' : 'old'} onChange={e => setSortNewestFirst(e.target.value === 'new')} className="p-2 border rounded">
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>
      </div>

 
      <div className="space-y-4">
        {locations.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">No locations added yet. Navigate to the "Add Location" tab to get started.</p>
        ) : sortedStates.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-yellow-50 rounded-lg">No locations match your search criteria.</p>
        ) : (
          sortedStates.map(state => (
            <AccordionItem key={state} state={state} locations={groupedAndFilteredLocations[state]} onDeleteLocation={onDeleteLocation} customFields={customFields} onUpdateLocation={onUpdateLocation} />
          ))
        )}
      </div>
    </div>
  );
};

// LocationCard now supports inline edit. onUpdateLocation is called with the full updated object.
const LocationCard = ({ loc, onDeleteLocation, customFields = [], onUpdateLocation, style = {} }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...loc });

  useEffect(() => setEditData({ ...loc }), [loc]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = () => {
    // No required validation here; empty values allowed
    onUpdateLocation && onUpdateLocation(editData);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditData({ ...loc });
    setIsEditing(false);
  };

  return (
    <div style={style} className="lm-fade-in bg-white p-5 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transform transition duration-300 ease-out hover:scale-105">
      {isEditing ? (
        <div>
          <div className="grid grid-cols-1 gap-3">
            <input name="companyName" value={editData.companyName || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="Company Name" />
            <input name="ownerName" value={editData.ownerName || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="Owner Name" />
            <input name="address" value={editData.address || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="Address" />
            <select name="state" value={editData.state || ''} onChange={(e) => {
              handleEditChange(e);
              // clear LGA when state changes
              setEditData(prev => ({ ...prev, lga: '' }));
            }} className="p-2 border rounded">
              <option value="">Select state</option>
              {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {editData.state ? (
              lgasByState[editData.state] && lgasByState[editData.state].length > 0 ? (
                <select name="lga" value={editData.lga || ''} onChange={handleEditChange} className="p-2 border rounded">
                  <option value="">Select LGA</option>
                  {lgasByState[editData.state].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <input name="lga" value={editData.lga || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="LGA" />
              )
            ) : (
              <select disabled className="p-2 border rounded"><option>Select state first</option></select>
            )}

            <input name="email" value={editData.email || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="Email" />
            <input name="phone" value={editData.phone || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder="Phone" />

            <div className="flex gap-2">
              <label className="flex items-center space-x-2">
                <input type="radio" name="partnerType" value="FSR" checked={(editData.partnerType || '') === 'FSR'} onChange={handleEditChange} />
                <span>FSR</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="partnerType" value="SLOT" checked={(editData.partnerType || '') === 'SLOT'} onChange={handleEditChange} />
                <span>SLOT</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="partnerType" value="Independent Agent" checked={(editData.partnerType || '') === 'Independent Agent'} onChange={handleEditChange} />
                <span>Independent Agent</span>
              </label>
            </div>

            {/* custom fields */}
            {customFields && customFields.length > 0 && customFields.map(f => (
              f.type === 'select' ? (
                <select key={f.name} name={f.name} value={editData[f.name] || ''} onChange={handleEditChange} className="p-2 border rounded">
                  <option value="">Select {f.label}</option>
                  {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input key={f.name} name={f.name} value={editData[f.name] || ''} onChange={handleEditChange} className="p-2 border rounded" placeholder={f.label} />
              )
            ))}

            <div className="flex mt-2 gap-2">
              <button type="button" onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded lm-focus">Save</button>
              <button type="button" onClick={cancelEdit} className="px-3 py-1 bg-gray-200 rounded lm-focus">Cancel</button>
              <button type="button" onClick={() => { if (window.confirm('Delete this location?')) onDeleteLocation(loc.id); }} className="ml-auto px-3 py-1 bg-red-600 text-white rounded lm-focus hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap">
              <h4 className="text-xl font-semibold text-blue-600 truncate mr-4">{loc.companyName}</h4>
              <span className={`flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 sm:mt-0 ${
                loc.partnerType === 'FSR' ? 'bg-green-100 text-green-800' :
                loc.partnerType === 'SLOT' ? 'bg-purple-100 text-purple-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                <Briefcase className="w-3 h-3 mr-1" />
                {loc.partnerType}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <span className="font-medium text-gray-900 w-24 flex-shrink-0">Owner:</span>
              <span className="truncate">{loc.ownerName || '—'}</span>
            </p>
            <p className="text-sm text-gray-700 mt-1 flex items-center">
              <span className="font-medium text-gray-900 w-24 flex-shrink-0">Address:</span>
              <span className="truncate">{loc.address || '—'}</span>
            </p>
            <p className="text-sm text-gray-700 mt-1 flex items-center">
              <span className="font-medium text-gray-900 w-24 flex-shrink-0">LGA:</span>
              <span className="truncate">{loc.lga || '—'}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <span className="font-medium text-gray-900 w-24 flex-shrink-0">Email:</span>
              <span className="truncate">{loc.email || '—'}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <span className="font-medium text-gray-900 w-24 flex-shrink-0">Phone:</span>
              <span className="truncate">{loc.phone || '—'}</span>
            </p>

            {/* custom fields display */}
            {customFields && customFields.length > 0 && customFields.map(field => (
              <p key={field.name} className="text-sm text-gray-600 mt-1 flex items-center">
                <span className="font-medium text-gray-900 w-24 flex-shrink-0">{field.label || field.name}:</span>
                <span className="truncate">{(loc[field.name] !== undefined && loc[field.name] !== null) ? String(loc[field.name]) : '—'}</span>
              </p>
            ))}
          </div>

          <div className="ml-4 flex flex-col gap-2">
              <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-blue-600 text-white rounded lm-focus hover:bg-blue-700 transition">Edit</button>
              <button onClick={() => onDeleteLocation(loc.id)} className="px-3 py-1 bg-red-600 text-white rounded lm-focus hover:bg-red-700 transition">Delete</button>
            </div>
        </div>
      )}
    </div>
  );
};
 
// --- Add Location ---
// Full predefined mapping of LGAs by state (from user-provided dataset).
const lgasByState = {
  "Abia": ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala-Ngwa North","Isiala-Ngwa South","Isuikwuato","Obi Nwa","Ohafia","Osisioma Ngwa","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu-Neochi"],
  "Adamawa": ["Demsa","Fufore","Ganye","Girei","Gombi","Guyuk","Hong","Jada","Lamurde","Madagali","Maiha","Mayo-Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"],
  "Akwa Ibom": ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat Enin","Nsit Atai","Nsit Ibom","Nsit Ubium","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"],
  "Anambra": ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onitsha North","Onitsha South","Orumba North","Orumba South","Oyi"],
  "Bauchi": ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Ganjuwa","Giade","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa Balewa","Toro","Warji","Zaki"],
  "Bayelsa": ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"],
  "Benue": ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Oturkpo","Tarka","Ukum","Ushongo","Vandeikya"],
  "Borno": ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"],
  "Cross River": ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obudu","Odukpani","Ogoja","Yakuur","Yala","Odubra"],
  "Delta": ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uvwie","Warri North","Warri South","Warri South West"],
  "Ebonyi": ["Abakaliki","Afikpo North","Afikpo South (Edda)","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"],
  "Edo": ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba Okha","Oredo","Orhionmwon","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"],
  "Ekiti": ["Ado Ekiti","Ikere","Ise/Orun","Ekiti East","Ekiti South West","Ekiti West","Emure","Gbonyin","Ido/Osi","Ijero","Ikole","Ilejemeje","Irepodun/Ifelodun","Moba","Oye"],
  "Enugu": ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo-Uwani"],
  "FCT - Abuja": ["Abaji","Abuja Municipal Area Council (AMAC)","Bwari","Gwagwalada","Kuje","Kwali"],
  "Gombe": ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"],
  "Imo": ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte Mbaise","Ideato North","Ideato South","Ikeduru","Ihitte/Uboma","Isu","Mbaitoli","Ngor Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West","Isiala Mbano"],
  "Jigawa": ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin Hausa","Kaugama","Kazaure","Kiri Kasama","Kiyawa","Kiyawa","Maigatari","Malam Madori","Miga","Ringim","Roni","Sule Tankarkar","Taura","Yankwashi"],
  "Kaduna": ["Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"],
  "Kano": ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warawa","Wudil"],
  "Katsina": ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dandume","Danja","Dan Musa","Daura","Dutsi","Dutsin Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai'Adua","Malumfashi","Mani","Mashi","Mate","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"],
  "Kebbi": ["Aleiro","Arewa Dandi","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"],
  "Kogi": ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela-Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa-Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Yagba East","Yagba West"],
  "Kwara": ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Isin","Kaiama","Moro","Offa","Oke Ero","Oyun","Pategi"],
  "Lagos": ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],
  "Nasarawa": ["Akwanga","Awe","Doma","Karim Lamido","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"],
  "Niger": ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Magama","Mariga","Mashegu","Mokwa","Muya","Pailoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"],
  "Ogun": ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Sagamu","Yewa North","Yewa South"],
  "Ondo": ["Akoko North-East","Akoko North-West","Akoko South-East","Akoko South-West","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"],
  "Osun": ["Aiyedaade","Aiyedire","Atakunmosa East","Atakunmosa West","Boluwaduro","Boripe","Ede North","Ede South","Egbedore","Ejigbo","Ife Central","Ife East","Ife North","Ife South","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"],
  "Oyo": ["Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Ori Ire","Oyo East","Oyo West","Saki East","Saki West","Surulere"],
  "Plateau": ["Bokkos","Barkin Ladi","Bassa","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang North","Langtang South","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"],
  "Rivers": ["Abua/Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emuoha","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba/Egbema/Ndoni","Ogu/Bolo","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port Harcourt","Tai"],
  "Sokoto": ["Binji","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kware","Kebbe","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"],
  "Taraba": ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kona","Kurmi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"],
  "Yobe": ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gogaram","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yusufari"],
  "Zamfara": ["Anka","Bakura","Birnin Magaji","Bukkuyum","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Tsafe","Zurmi","Chafe","Gummi"]
};

const nigerianStates = Object.keys(lgasByState).sort();

const AddLocation = ({ onAddLocation, onAddSuccess, customFields = [] }) => {
  const initialState = { companyName: '', address: '', email: '', phone: '', state: '', lga: '', ownerName: '', partnerType: '' };
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Ensure formData has keys for any configured custom fields (without overwriting existing values)
  useEffect(() => {
    if (!customFields || customFields.length === 0) return;
    setFormData(prev => {
      const next = { ...prev };
      customFields.forEach(f => {
        if (!(f.name in next)) next[f.name] = '';
      });
      return next;
    });
  }, [customFields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If state changes, reset selected LGA so user picks new one
    if (name === 'state') {
      setFormData(prev => ({ ...prev, [name]: value, lga: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const [showWarning, setShowWarning] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);

  const finalizeSubmit = async (locationData) => {
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });
    await new Promise(res => setTimeout(res, 300));
    try {
      onAddLocation(locationData);
      setFormData(initialState);
      setPendingLocation(null);
      onAddSuccess();
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Failed to add location.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prepare data but warn if any field is empty. User can proceed or cancel.
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const locationData = { ...formData, id, createdAt: new Date().toISOString() };

    // Build list of fields to check (base + custom)
    const baseFields = [
      { key: 'companyName', label: 'Company Name' },
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'address', label: 'Address' },
      { key: 'state', label: 'State' },
      { key: 'lga', label: 'LGA' },
      { key: 'partnerType', label: 'Partner Type' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' }
    ];
    const customFieldChecks = (customFields || []).map(f => ({ key: f.name, label: f.label || f.name }));
    const allChecks = [...baseFields, ...customFieldChecks];

    const missing = allChecks.filter(f => {
      const val = locationData[f.key];
      return val === undefined || val === null || String(val).trim() === '';
    }).map(f => f.label);

    if (missing.length > 0) {
      setPendingLocation(locationData);
      setStatusMessage({ type: '', text: '' });
      setShowWarning(true);
      return;
    }

    // No missing fields — proceed immediately
    finalizeSubmit(locationData);
  };

  const StatusDisplay = () => {
    if (!statusMessage.text) return null;
    const isError = statusMessage.type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    return <div className={`p-3 border rounded-lg mb-4 ${bgColor} ${textColor}`}>{statusMessage.text}</div>;
  };

  const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><PlusCircle className="w-6 h-6 mr-2 text-blue-500" /> Add New Company Location</h2>
      <StatusDisplay />
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100 lm-slide-up">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
          <input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={inputClasses} placeholder="e.g., Acme Inc. Lagos" />
        </div>
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">Owner Name <span className="text-red-500">*</span></label>
          <input id="ownerName" type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className={inputClasses} placeholder="e.g., John Doe" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address (Street/City) <span className="text-red-500">*</span></label>
          <input id="address" type="text" name="address" value={formData.address} onChange={handleChange} className={inputClasses} placeholder="e.g., 123 Main St, Ikeja" />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
          <select id="state" name="state" value={formData.state} onChange={handleChange} className={inputClasses}>
            <option value="" disabled>Select a state...</option>
            {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {/* Local Government Area (dependent on State) */}
        <div>
          <label htmlFor="lga" className="block text-sm font-medium text-gray-700 mb-1">Local Government (LGA) <span className="text-red-500">*</span></label>
          {formData.state ? (
            lgasByState[formData.state] && lgasByState[formData.state].length > 0 ? (
              <select id="lga" name="lga" value={formData.lga} onChange={handleChange} className={inputClasses}>
                <option value="" disabled>Select an LGA...</option>
                {lgasByState[formData.state].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <select id="lga" name="lga" disabled className={inputClasses}>
                <option>No predefined LGAs for this state</option>
              </select>
            )
          ) : (
            <select id="lga" name="lga" disabled className={inputClasses}>
              <option>Select a state first</option>
            </select>
          )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type</label>
          <div className="flex gap-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="partnerType" value="FSR" checked={formData.partnerType === 'FSR'} onChange={handleChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">FSR</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="partnerType" value="SLOT" checked={formData.partnerType === 'SLOT'} onChange={handleChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">SLOT</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="partnerType" value="Independent Agent" checked={formData.partnerType === 'Independent Agent'} onChange={handleChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Independent Agent</span>
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="e.g., info@acme.com" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="e.g., 0801 234 5678" />
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed lm-focus">
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-2" />}
          {isLoading ? 'Saving Company...' : 'Save Company'}
        </button>
      </form>

      {/* Warning modal when some fields are missing */}
      {showWarning && pendingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowWarning(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 lm-fade-in">
            <h3 className="text-lg font-semibold">Incomplete fields detected</h3>
            <p className="mt-2 text-sm text-gray-600">Some fields are empty. Do you want to proceed anyway?</p>
            <div className="mt-3 text-sm text-gray-700">
              <strong>Missing fields:</strong>
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                {( () => {
                  const baseFields = ['Company Name','Owner Name','Address','State','LGA','Partner Type','Email','Phone'];
                  const customLabels = (customFields || []).map(f => f.label || f.name);
                  const allLabels = [...baseFields, ...customLabels];
                  // compute which labels are missing by comparing pendingLocation
                  const missing = allLabels.filter((label, idx) => {
                    const key = idx < baseFields.length ? ['companyName','ownerName','address','state','lga','partnerType','email','phone'][idx] : (customFields[idx - baseFields.length].name);
                    const v = pendingLocation[key];
                    return v === undefined || v === null || String(v).trim() === '';
                  });
                  return missing.map(m => <li key={m}>{m}</li>);
                })() }
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowWarning(false); setPendingLocation(null); }} className="px-4 py-2 bg-gray-200 rounded lm-focus">Cancel</button>
              <button onClick={() => { setShowWarning(false); if (pendingLocation) finalizeSubmit(pendingLocation); }} className="px-4 py-2 bg-blue-600 text-white rounded lm-focus">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Settings Panel ---
const SettingsPanel = ({ locations, setLocations, customFields = [], setCustomFields }) => {
  const [message, setMessage] = useState({ type: '', text: '' });
  // New custom field inputs
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const handleSaveToFile = () => {
    setMessage({ type: '', text: '' });
    try {
      const dataStr = JSON.stringify(locations, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'locations_backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Successfully saved ${locations.length} entries to locations_backup.json` });
    } catch (error) {
      console.error('Failed to save file:', error);
      setMessage({ type: 'error', text: 'Failed to save file.' });
    }
  };
// I AM A BOY
  // Export locations (including customFields) to CSV for Excel
  const handleExportToCSV = () => {
    setMessage({ type: '', text: '' });
    try {
      // Build header columns
      const baseCols = [
        { key: 'companyName', label: 'Company Name' },
        { key: 'ownerName', label: 'Owner Name' },
        { key: 'address', label: 'Address' },
        { key: 'state', label: 'State' },
        { key: 'lga', label: 'LGA' },
        { key: 'partnerType', label: 'Partner Type' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'id', label: 'ID' }
      ];

      const customCols = (customFields || []).map(f => ({ key: f.name, label: f.label || f.name }));
      const cols = [...baseCols, ...customCols];

      // CSV escape helper
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let s = typeof val === 'object' ? JSON.stringify(val) : String(val);
        // Replace CRLF with LF
        s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // Escape double quotes by doubling
        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
          s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      const headerRow = cols.map(c => escapeCsv(c.label)).join(',');
      const rows = locations.map(loc => cols.map(c => escapeCsv(loc[c.key])).join(','));

      const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n'); // BOM for Excel
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'locations_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Exported ${locations.length} entries to locations_export.csv` });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setMessage({ type: 'error', text: 'Failed to export CSV.' });
    }
  };

  const handleLoadFromFile = (event) => {
    setMessage({ type: '', text: '' });
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedData = JSON.parse(e.target.result);
          if (Array.isArray(loadedData)) {
            setLocations(loadedData);
            setMessage({ type: 'success', text: `Successfully loaded ${loadedData.length} entries from file.` });
          } else throw new Error('Invalid file format: not an array.');
        } catch (error) {
          console.error('Failed to parse file:', error);
          setMessage({ type: 'error', text: 'Failed to load file. Ensure it is a valid JSON file.' });
        }
      };
      reader.readAsText(file);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid .json file.' });
    }
    event.target.value = null;
  };

  // Load data from Excel (.xlsx/.xls). Maps common column headers to our app fields.
  const handleLoadFromExcel = (event) => {
    setMessage({ type: '', text: '' });
    const file = event.target.files[0];
    if (!file) return;
    // Ensure XLSX global is available
    if (typeof XLSX === 'undefined') {
      setMessage({ type: 'error', text: 'Excel parser not available. Ensure xlsx script is loaded in index.html.' });
      event.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'array' });
        const first = wb.SheetNames && wb.SheetNames[0];
        if (!first) throw new Error('No sheets found');
        const ws = wb.Sheets[first];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const mapped = rows.map(row => {
          // helper to read multiple possible header variants
          const r = (k) => row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '' ? row[k] : undefined;
          const companyName = r('companyName') || r('Company Name') || r('company') || '';
          const ownerName = r('ownerName') || r('Owner Name') || r('owner') || '';
          const address = r('address') || r('Address') || '';
          const state = r('state') || r('State') || '';
          const lga = r('lga') || r('LGA') || '';
          const partnerType = r('partnerType') || r('Partner Type') || r('partner') || '';
          const email = r('email') || r('Email') || '';
          const phone = r('phone') || r('Phone') || '';
          const id = r('id') || r('ID') || `id-${Date.now()}-${Math.floor(Math.random()*10000)}`;
          const createdAt = r('createdAt') || r('Created At') || new Date().toISOString();

          // copy any other columns as custom fields (normalize keys)
          const baseKeys = new Set(['id','ID','companyName','Company Name','company','ownerName','Owner Name','owner','address','Address','state','State','lga','LGA','partnerType','Partner Type','partner','email','Email','phone','Phone','createdAt','Created At']);
          const extras = {};
          Object.keys(row).forEach(k => {
            if (!baseKeys.has(k)) {
              const key = k.replace(/\s+/g, '_');
              extras[key] = row[k];
            }
          });

          return {
            id,
            createdAt,
            companyName,
            ownerName,
            address,
            state,
            lga,
            partnerType,
            email,
            phone,
            ...extras
          };
        });

        if (!Array.isArray(mapped)) throw new Error('No rows parsed');
        setLocations(mapped);
        setMessage({ type: 'success', text: `Successfully loaded ${mapped.length} rows from Excel.` });
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        setMessage({ type: 'error', text: 'Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.' });
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = null;
  };

  const StatusDisplay = () => {
    if (!message.text) return null;
    const isError = message.type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    return <div className={`p-3 border rounded-lg mb-4 ${bgColor} ${textColor}`}>{message.text}</div>;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Settings className="w-6 h-6 mr-2 text-blue-500" /> Settings</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4 max-w-lg lm-slide-up">
        <p className="text-gray-700">Manage your application data by exporting or importing a text file.</p>
        <StatusDisplay />
          <div className="space-y-4">
            <button onClick={handleSaveToFile} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"><Save className="w-5 h-5 mr-2" /> Save Data to Text File</button>
            <button onClick={handleExportToCSV} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"><Save className="w-5 h-5 mr-2" /> Export to Excel (.csv)</button>
            <label className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 cursor-pointer"><FileUp className="w-5 h-5 mr-2" /> Load Data from Text File<input type="file" className="hidden" accept=".json" onChange={handleLoadFromFile} /></label>
            <label className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 cursor-pointer"><FileUp className="w-5 h-5 mr-2" /> Load Data from Excel (.xlsx/.xls)<input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleLoadFromExcel} /></label>
          </div>
        {/* Custom Fields Manager */}
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Custom Location Fields</h3>
          <p className="text-sm text-gray-600 mb-3">Add additional fields that will appear on the Add Location form and saved with each location.</p>

          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Field Label</label>
              <input type="text" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., Gender" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Field Type</label>
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full p-2 border rounded">
                <option value="text">Text</option>
                <option value="select">Select (predefined options)</option>
              </select>
            </div>
            {newFieldType === 'select' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Options (comma separated)</label>
                <input type="text" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., Male,Female" />
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => {
                const label = (newFieldLabel || '').trim();
                if (!label) { setMessage({ type: 'error', text: 'Field label is required.' }); return; }
                // derive a safe field name key
                const nameKey = label.replace(/\s+/g, '_');
                if (customFields.find(f => f.name === nameKey)) { setMessage({ type: 'error', text: 'A field with that name already exists.' }); return; }
                const field = { name: nameKey, label, type: newFieldType };
                if (newFieldType === 'select') {
                  field.options = newFieldOptions.split(',').map(s => s.trim()).filter(Boolean);
                }
                setCustomFields([...customFields, field]);
                setNewFieldLabel(''); setNewFieldType('text'); setNewFieldOptions('');
                setMessage({ type: 'success', text: `Added custom field "${label}".` });
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Add Field</button>
              <button type="button" onClick={() => { setNewFieldLabel(''); setNewFieldType('text'); setNewFieldOptions(''); setMessage({ type: '', text: '' }); }} className="px-4 py-2 bg-gray-200 rounded lm-focus">Clear</button>
            </div>
          </div>

          {customFields.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium">Configured Fields</h4>
              <ul className="mt-2 space-y-2">
                {customFields.map(f => (
                  <li key={f.name} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{f.label} <span className="text-xs text-gray-500">({f.type})</span></div>
                      {f.type === 'select' && <div className="text-sm text-gray-600">Options: { (f.options || []).join(', ') }</div>}
                    </div>
                    <div>
                      <button type="button" onClick={() => {
                        if (!window.confirm(`Remove field "${f.label}"? This will not delete existing data on saved locations.`)) return;
                        setCustomFields(customFields.filter(x => x.name !== f.name));
                        setMessage({ type: 'success', text: `Removed field "${f.label}".` });
                      }} className="px-3 py-1 bg-red-100 text-red-700 rounded">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 italic pt-4 border-t border-gray-200">**Note:** Loading a file will overwrite any unsaved changes in the current session. Always save your current data first if you wish to keep it.</p>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('locationsData');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  // Custom fields configurable in Settings (persisted to localStorage)
  const [customFields, setCustomFields] = useState(() => {
    try {
      const raw = localStorage.getItem('customFields');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse customFields from storage', e);
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem('customFields', JSON.stringify(customFields)); } catch (e) { console.error(e); }
  }, [customFields]);

  useEffect(() => {
    try { localStorage.setItem('locationsData', JSON.stringify(locations)); } catch (e) { console.error(e); }
  }, [locations]);

  const handleAddLocation = (newLocation) => setLocations(prev => [...prev, newLocation]);

  const handleDeleteLocation = useCallback((locationId) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    setLocations(prev => prev.filter(l => l.id !== locationId));
  }, []);

  // Update an existing location (called from LocationCard edit)
  const handleUpdateLocation = useCallback((updatedLocation) => {
    setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'view':
        return <ViewLocations locations={locations} onDeleteLocation={handleDeleteLocation} customFields={customFields} onUpdateLocation={handleUpdateLocation} />;
      case 'add':
        return <AddLocation onAddLocation={handleAddLocation} onAddSuccess={() => setActiveTab('view')} customFields={customFields} />;
      case 'settings':
        return <SettingsPanel locations={locations} setLocations={setLocations} customFields={customFields} setCustomFields={setCustomFields} />;
      default:
        return <ViewLocations locations={locations} onDeleteLocation={handleDeleteLocation} customFields={customFields} />;
    }
  };

  const TabButton = ({ tab, icon: IconComp, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center p-3 sm:p-4 text-sm font-medium transition duration-200 w-full rounded-lg ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-700 hover:text-white'}`}>
      <IconComp className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      <nav className="flex flex-col items-center p-2 sm:p-4 bg-blue-800 shadow-xl w-16 sm:w-28 space-y-4">
        {/* Logo image (optional). Place a file named `logo.png` in the project root to show it here. If the image is missing it will be hidden. */}
        <div className="mt-2 mb-2 hidden sm:block">
          <img src="logo.png" alt="Logo" title="Logo" className="w-16 h-16 object-contain mx-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div className="mt-2 mb-4 text-white font-extrabold text-xl hidden sm:block">LM</div>
        <TabButton tab="view" icon={MapPin} label="View" />
        <TabButton tab="add" icon={PlusCircle} label="Add" />
        <TabButton tab="settings" icon={Settings} label="Settings" />
      </nav>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-2xl sm:rounded-xl">{renderContent()}</div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-blue-800 shadow-2xl sm:hidden">
          <div className="flex justify-around p-1">
            <TabButton tab="view" icon={MapPin} label="View" />
            <TabButton tab="add" icon={PlusCircle} label="Add" />
            <TabButton tab="settings" icon={Settings} label="Settings" />
          </div>
        </div>
      </main>
    </div>
  );
};

// Mount app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
