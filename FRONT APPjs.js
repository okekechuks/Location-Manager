import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  PlusCircle, 
  Settings, 
  Trash2, 
  Loader2, 
  Search, 
  User, 
  Briefcase, 
  ChevronDown,
  Save,
  FileUp
} from 'lucide-react';

// --- Helper Components ---

// New Accordion Component for grouping by state
const AccordionItem = ({ state, locations, onDeleteLocation }) => {
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
        <ChevronDown
          className={`w-6 h-6 text-blue-500 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gray-200">
          {locations.map(loc => (
            <LocationCard key={loc.id} loc={loc} onDeleteLocation={onDeleteLocation} />
          ))}
        </div>
      )}
    </div>
  );
};

// New Location Card Component
const LocationCard = ({ loc, onDeleteLocation }) => (
  <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex justify-between items-start">
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between flex-wrap">
          <h4 className="text-xl font-semibold text-blue-600 truncate mr-4">{loc.companyName}</h4>
          <span className={`flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 sm:mt-0 ${
            loc.partnerType === 'FSR' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
          }`}>
            <Briefcase className="w-3 h-3 mr-1" />
            {loc.partnerType}
          </span>
      </div>
      
      <p className="text-sm text-gray-700 mt-2 flex items-center">
        <span className="font-medium text-gray-900 w-24 flex-shrink-0">Owner:</span> 
        <span className="truncate">{loc.ownerName}</span>
      </p>
      <p className="text-sm text-gray-700 mt-1 flex items-center">
        <span className="font-medium text-gray-900 w-24 flex-shrink-0">Address:</span> 
        <span className="truncate">{loc.address}</span>
      </p>
      <p className="text-sm text-gray-600 mt-1 flex items-center">
        <span className="font-medium text-gray-900 w-24 flex-shrink-0">Email:</span> 
        <span className="truncate">{loc.email}</span>
      </p>
      <p className="text-sm text-gray-600 mt-1 flex items-center">
        <span className="font-medium text-gray-900 w-24 flex-shrink-0">Phone:</span> 
        <span className="truncate">{loc.phone}</span>
      </p>
    </div>
    <button
      onClick={() => onDeleteLocation(loc.id)}
      className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
      title={`Delete ${loc.companyName}`}
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
);

// --- 1. View Locations Tab Component ---
const ViewLocations = ({ locations, onDeleteLocation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filtering and grouping
  const groupedAndFilteredLocations = useMemo(() => {
    const filtered = locations.filter(loc => 
      loc.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.partnerType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group the filtered locations by state
    const grouped = filtered.reduce((acc, loc) => {
      const state = loc.state || 'Uncategorized';
      if (!acc[state]) {
        acc[state] = [];
      }
      acc[state].push(loc);
      return acc;
    }, {});

    // Sort the companies within each state group by companyName
    for (const state in grouped) {
      grouped[state].sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
    }

    return grouped;
  }, [locations, searchTerm]);

  // Get sorted list of states
  const sortedStates = Object.keys(groupedAndFilteredLocations).sort();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <MapPin className="w-6 h-6 mr-2 text-blue-500" /> All Locations ({locations.length})
      </h2>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Company, Owner, State, Partner Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          />
        </div>
      </div>

      {/* Location List (Accordion) */}
      <div className="space-y-4">
        {locations.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">No locations added yet. Navigate to the "Add Location" tab to get started.</p>
        ) : sortedStates.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-yellow-50 rounded-lg">No locations match your search criteria.</p>
        ) : (
          sortedStates.map(state => (
            <AccordionItem
              key={state}
              state={state}
              locations={groupedAndFilteredLocations[state]}
              onDeleteLocation={onDeleteLocation}
            />
          ))
        )}
      </div>
    </div>
  );
};


// --- 2. Add Location Tab Component ---

// List of Nigerian States + FCT
const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", 
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", 
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", 
  "Zamfara", "FCT - Abuja"
].sort();

const AddLocation = ({ onAddLocation, onAddSuccess }) => {
  const initialState = {
    companyName: '',
    address: '',
    email: '',
    phone: '',
    state: '',
    ownerName: '',
    partnerType: '' // Can be 'FSR' or 'SLOT'
  };
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false); // Kept for visual feedback
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for all new required fields
    if (!formData.companyName || !formData.address || !formData.email || !formData.phone || !formData.state || !formData.ownerName || !formData.partnerType) {
        setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
        return;
    }

    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    const locationData = {
      ...formData,
      id: crypto.randomUUID(), // Add a unique ID
      createdAt: new Date().toISOString(), // Add a timestamp
    };
    
    // Simulate async save for visual feedback
    await new Promise(res => setTimeout(res, 300)); 

    try {
      onAddLocation(locationData); // Pass new data up to parent
      setFormData(initialState); // Clear form
      onAddSuccess(); // Switch to view tab
    } catch (error) {
      console.error("Error adding document to state: ", error);
      setStatusMessage({ type: 'error', text: 'Failed to add location.' });
    } finally {
      setIsLoading(false);
    }
  };

  const StatusDisplay = () => {
    if (!statusMessage.text) return null;
    const isError = statusMessage.type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    return (
      <div className={`p-3 border rounded-lg mb-4 ${bgColor} ${textColor}`}>
        {statusMessage.text}
      </div>
    );
  };

  const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <PlusCircle className="w-6 h-6 mr-2 text-blue-500" /> Add New Company Location
      </h2>
      
      <StatusDisplay />

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
          <input
            id="companyName"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g., Acme Inc. Lagos"
            required
          />
        </div>
        
        {/* Owner Name */}
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">Owner Name <span className="text-red-500">*</span></label>
          <input
            id="ownerName"
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g., John Doe"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address (Street/City) <span className="text-red-500">*</span></label>
          <input
            id="address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g., 123 Main St, Ikeja"
            required
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={inputClasses}
            required
          >
            <option value="" disabled>Select a state...</option>
            {nigerianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        {/* Partner Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type <span className="text-red-500">*</span></label>
          <div className="flex gap-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="partnerType"
                value="FSR"
                checked={formData.partnerType === 'FSR'}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                required
              />
              <span className="text-sm font-medium text-gray-700">FSR</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="partnerType"
                value="SLOT"
                checked={formData.partnerType === 'SLOT'}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">SLOT</span>
            </label>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g., info@acme.com"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g., 0801 234 5678"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-2" />}
          {isLoading ? 'Saving Company...' : 'Save Company'}
        </button>
      </form>
    </div>
  );
};

// --- 3. Settings Tab Component ---
const SettingsPanel = ({ locations, setLocations }) => {
  const [message, setMessage] = useState({ type: '', text: '' });

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
      console.error("Failed to save file:", error);
      setMessage({ type: 'error', text: 'Failed to save file.' });
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
          } else {
            throw new Error("Invalid file format: not an array.");
          }
        } catch (error) {
          console.error("Failed to parse file:", error);
          setMessage({ type: 'error', text: 'Failed to load file. Ensure it is a valid JSON file.' });
        }
      };
      reader.readAsText(file);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid .json file.' });
    }
    // Reset file input
    event.target.value = null;
  };
  
  const StatusDisplay = () => {
    if (!message.text) return null;
    const isError = message.type === 'error';
    const bgColor = isError ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    return (
      <div className={`p-3 border rounded-lg mb-4 ${bgColor} ${textColor}`}>
        {message.text}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Settings className="w-6 h-6 mr-2 text-blue-500" /> Settings
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4 max-w-lg">
        <p className="text-gray-700">Manage your application data by exporting or importing a text file.</p>
        
        <StatusDisplay />

        <div className="space-y-4">
          <button
            onClick={handleSaveToFile}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Data to Text File
          </button>
          
          <label className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 cursor-pointer">
            <FileUp className="w-5 h-5 mr-2" />
            Load Data from Text File
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleLoadFromFile}
            />
          </label>
        </div>
        
        <p className="text-sm text-gray-600 italic pt-4 border-t border-gray-200">
          **Note:** Loading a file will overwrite any unsaved changes in the current session. Always save your current data first if you wish to keep it.
        </p>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState('view');
  // Initialize locations from localStorage if available, otherwise empty array
  const [locations, setLocations] = useState(() => {
    try {
        const savedLocations = localStorage.getItem('locationsData');
        return savedLocations ? JSON.parse(savedLocations) : [];
    } catch (e) {
        console.error("Failed to parse localStorage data:", e);
        return [];
    }
  });

  // Save to localStorage whenever locations change
  useEffect(() => {
    try {
        localStorage.setItem('locationsData', JSON.stringify(locations));
        console.log(`[LocalStorage] Saved ${locations.length} locations.`);
    } catch (e) {
        console.error("Failed to save to localStorage:", e);
    }
  }, [locations]);

  // Add new location
  const handleAddLocation = (newLocation) => {
    setLocations(prevLocations => [
      ...prevLocations,
      newLocation
    ]);
  };

  // Delete function
  const handleDeleteLocation = useCallback((locationId) => {
    if (!window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
        return;
    }
    setLocations(prevLocations => prevLocations.filter(loc => loc.id !== locationId));
  }, []);

  // Tab rendering logic
  const renderContent = () => {
    switch (activeTab) {
      case 'view':
        return <ViewLocations locations={locations} onDeleteLocation={handleDeleteLocation} />;
      case 'add':
        return <AddLocation onAddLocation={handleAddLocation} onAddSuccess={() => setActiveTab('view')} />;
      case 'settings':
        return <SettingsPanel locations={locations} setLocations={setLocations} />;
      default:
        return <ViewLocations locations={locations} onDeleteLocation={handleDeleteLocation} />;
    }
  };
  
  // Tab Button Component
  const TabButton = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center p-3 sm:p-4 text-sm font-medium transition duration-200 w-full rounded-lg ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-blue-200 hover:bg-blue-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      
      {/* Sidebar Navigation */}
      <nav className="flex flex-col items-center p-2 sm:p-4 bg-blue-800 shadow-xl w-16 sm:w-28 space-y-4">
        <div className="mt-4 mb-8 text-white font-extrabold text-2xl hidden sm:block">LM</div>
        <TabButton tab="view" icon={MapPin} label="View" />
        <TabButton tab="add" icon={PlusCircle} label="Add" />
        <TabButton tab="settings" icon={Settings} label="Settings" />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-2xl sm:rounded-xl">
            {renderContent()}
          </div>
        </div>
        
        {/* Footer for Mobile/Small Screens */}
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

export default App;

