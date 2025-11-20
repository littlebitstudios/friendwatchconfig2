import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './App.css';
import YAML from 'js-yaml';
// NEW: Import the About component
import About from './About'; 


// --- Configuration Interfaces ---
interface NtfyConfig {
  enabled: boolean;
  server: string;
  topic: string;
  sendtest: 'off' | string;
}

interface Config {
  aliases: Record<string, string>;
  ntfy: NtfyConfig;
  watched: string[];
  watchedonly: boolean;
  windowsmode: boolean;
}

// --- Friend Interfaces ---
interface Game { name: string; imageUri: string; shopUri: string; totalPlayTime: number; firstPlayedAt: number; sysDescription: string; }
interface Route { appName: string; userName: string; shopUri: string; imageUri: string; channel: string; }
interface Presence {
  state: 'ONLINE' | 'OFFLINE' | 'AWAY' | string;
  updatedAt: number; logoutAt: number;
  game: Game | object; 
  platform: number;
}
interface Friend {
  id: number; nsaId: string; imageUri: string; image2Uri: string; name: string;
  isFriend: boolean; isFavoriteFriend: boolean; isServiceUser: boolean; isNew: boolean;
  isOnlineNotificationEnabled: boolean; friendCreatedAt: number;
  route: Route; presence: Presence;
}

// Define the possible filter values
type FilterType = 'ALL' | 'WATCHED' | 'HAS_ALIAS';

// --- Type Guard for Game ---
function isGame(game: unknown): game is Game {
  return typeof game === 'object' && game !== null && 'name' in game && typeof (game as Game).name === 'string';
}

// --- Type Definitions for Events ---
type FileChangeEvent = ChangeEvent<HTMLInputElement>;
type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement>;


// --- React Component ---
function App() {
  const defaultNtfy: NtfyConfig = {
    enabled: false,
    server: '',
    topic: '',
    sendtest: 'off'
  };
  const [config, setConfig] = useState<Config>({
    aliases: {},
    watched: [],
    ntfy: defaultNtfy,
    watchedonly: false, windowsmode: false
  });
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // NEW: State for view management
  const [view, setView] = useState<'config' | 'about'>('config');

  // View switch handlers
  const showConfig = () => setView('config');
  const showAbout = () => setView('about');


  // --- Configuration Handlers ---
  const handleConfigChange = (e: FormChangeEvent) => {
    const { name, value, type } = e.target;
    
    const isCheckbox = type === 'checkbox';
    const checkedValue = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    const newValue = isCheckbox ? checkedValue : value;

    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      
      setConfig(prevConfig => ({
        ...prevConfig,
        [parentKey]: {
          ...(prevConfig.ntfy),
          [childKey]: newValue,
        },
      } as Config));
    } else {
      setConfig(prevConfig => ({
        ...prevConfig,
        [name]: newValue,
      } as Config));
    }
  };


  const handleWatchedToggle = (nsaId: string, isChecked: boolean) => {
    setConfig(prevConfig => {
      const watched = prevConfig.watched;
      let newWatched: string[];

      if (isChecked) {
        newWatched = [...new Set([...watched, nsaId])];
      } else {
        newWatched = watched.filter(id => id !== nsaId);
      }

      return {
        ...prevConfig,
        watched: newWatched
      };
    });
  };

  const handleAliasChange = (nsaId: string, newAlias: string) => {
    setConfig(prevConfig => {
      const newAliases = { ...prevConfig.aliases };

      if (newAlias.trim() === '') {
        delete newAliases[nsaId];
      } else {
        newAliases[nsaId] = newAlias.trim();
      }

      return {
        ...prevConfig,
        aliases: newAliases
      };
    });
  };

  // Save function to download configuration.yaml
  const handleSaveConfig = () => {
    if (Object.keys(config.aliases).length === 0 && config.watched.length === 0) {
        alert("Configuration is empty. Please load or edit the config first.");
        return;
    }
      
    try {
        const yamlString = YAML.dump(config, { indent: 2 });
        const blob = new Blob([yamlString], { type: 'text/yaml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'configuration.yaml';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert("Configuration downloaded successfully as configuration.yaml");

    } catch (error) {
        console.error("Error saving configuration:", error);
        alert("Failed to save configuration file.");
    }
  };

  // --- File Loading Handlers ---
  function parseConfig(event: FileChangeEvent) {
    const configFile = event.target.files?.[0];
    if (!configFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedObject = YAML.load(e.target?.result as string) as Config;
        setConfig({
          ...parsedObject,
          ntfy: {
            enabled: parsedObject.ntfy?.enabled ?? false,
            server: parsedObject.ntfy?.server ?? '',
            topic: parsedObject.ntfy?.topic ?? '',
            sendtest: parsedObject.ntfy?.sendtest ?? 'off'
          }
        });
      } catch (error) { console.error("Error parsing YAML file:", error); }
    };
    reader.readAsText(configFile);
  }

  function loadFriends(event: FileChangeEvent) {
    const friendsFile = event.target.files?.[0];
    if (!friendsFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedArray = JSON.parse(e.target?.result as string) as Friend[];
        setFriends(parsedArray);
      } catch (error) { console.error("Error parsing JSON file:", error); }
    };
    reader.readAsText(friendsFile);
  }

  // --- Utility Functions ---
  const getFriendStatus = (friend: Friend) => {
    if (friend.presence && friend.presence.logoutAt === 0) {
      return '👻 INVISIBLE';
    }
    const status = (friend.presence?.state || 'UNKNOWN').toUpperCase();
    if (status === 'ONLINE') return '🟢 ONLINE';
    if (status === 'OFFLINE') return '⚫ OFFLINE';
    if (status === 'AWAY') return '🌙 AWAY';
    return `⚪ ${status}`;
  }

  const handleSearchChange = (e: FormChangeEvent) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: FormChangeEvent) => {
    setFilterType(e.target.value as FilterType);
  };

  // --- Filtering Logic ---
  const watchedSet = new Set(config.watched);

  const filteredFriends = friends.filter(friend => {
    const nameMatch = friend.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;

    if (filterType === 'ALL') return true;

    if (filterType === 'WATCHED') {
      return watchedSet.has(friend.nsaId);
    }

    if (filterType === 'HAS_ALIAS') {
      const alias = config.aliases[friend.nsaId] ?? '';
      return alias.trim().length > 0;
    }

    return true;
  });

  // --- Conditional Rendering of the Configuration View ---
  const renderConfigView = () => (
      <>
          <div className="file-input-container">
              <div>
                  <h3>Load Configuration (YAML)</h3>
                  <input type="file" accept=".yaml,.yml" onChange={parseConfig} />
              </div>
              <div>
                  <h3>Load Friends List (JSON)</h3>
                  <input type="file" accept=".json" onChange={loadFriends} />
              </div>
          </div>

          <hr />

          <div className="main-content-container">

              <div className="config-panel">
                  <div className="config-panel-header">
                      <h2>Configuration Settings</h2>
                      <button 
                          onClick={handleSaveConfig} 
                          className="save-button"
                          disabled={Object.keys(config.aliases).length === 0}
                      >
                          ⬇️ Save Config
                      </button>
                  </div>


                  {Object.keys(config.aliases).length > 0 ? (
                      <form className="config-form">
                          {/* --- Top-Level Booleans --- */}
                          <div className="form-group-checkbox">
                              <label htmlFor="watchedonly">Watched Only</label>
                              <input
                                  type="checkbox"
                                  id="watchedonly"
                                  name="watchedonly"
                                  checked={config.watchedonly}
                                  onChange={handleConfigChange}
                              />
                          </div>
                          <div className="form-group-checkbox">
                              <label htmlFor="windowsmode">Windows Mode</label>
                              <input
                                  type="checkbox"
                                  id="windowsmode"
                                  name="windowsmode"
                                  checked={config.windowsmode}
                                  onChange={handleConfigChange}
                              />
                          </div>

                          {/* --- NTFY Nested Settings --- */}
                          <h3 className="sub-heading">Ntfy Settings</h3>
                          <div className="form-group-checkbox">
                              <label htmlFor="ntfy.enabled">Enabled</label>
                              <input
                                  type="checkbox"
                                  id="ntfy.enabled"
                                  name="ntfy.enabled"
                                  checked={config.ntfy.enabled}
                                  onChange={handleConfigChange}
                              />
                          </div>

                          <div className="form-group-text">
                              <label htmlFor="ntfy.server">Server URL</label>
                              <input
                                  type="text"
                                  id="ntfy.server"
                                  name="ntfy.server"
                                  value={config.ntfy.server || ''}
                                  onChange={handleConfigChange}
                              />
                          </div>

                          <div className="form-group-text">
                              <label htmlFor="ntfy.topic">Topic ID</label>
                              <input
                                  type="text"
                                  id="ntfy.topic"
                                  name="ntfy.topic"
                                  value={config.ntfy.topic || ''}
                                  onChange={handleConfigChange}
                              />
                          </div>

                          <div className="form-group-text">
                              <label htmlFor="ntfy.sendtest">Send Test</label>
                              <input
                                  type="text"
                                  id="ntfy.sendtest"
                                  name="ntfy.sendtest"
                                  value={config.ntfy.sendtest || 'off'}
                                  onChange={handleConfigChange}
                              />
                          </div>

                          {/* --- Non-Editable Data Display --- */}
                          <hr style={{ margin: '20px 0' }} />
                          <h3 className="sub-heading">Non-Editable Data</h3>
                          <h4>Watched Friend IDs ({config.watched.length})</h4>
                          <div className="read-only-data">
                              <pre style={{ fontSize: '0.8em', overflowX: 'auto' }}>
                                  {config.watched.join(', ')}
                              </pre>
                          </div>

                          <h4>Aliases ({Object.keys(config.aliases).length})</h4>
                          <div className="read-only-data">
                              <pre style={{ fontSize: '0.8em' }}>
                                  {JSON.stringify(config.aliases, null, 2)}
                              </pre>
                          </div>

                      </form>
                  ) : (
                      <p>Please load a configuration file.</p>
                  )}
              </div>

              <div className="friends-panel">
                  <h2>Friends List ({friends.length} Loaded)</h2>

                  <div className="filter-control-container">
                      <label htmlFor="filter-select">Filter By:</label>
                      <select
                          id="filter-select"
                          value={filterType}
                          onChange={handleFilterChange}
                      >
                          <option value="ALL">All Friends</option>
                          <option value="WATCHED">Watched</option>
                          <option value="HAS_ALIAS">Has Alias</option>
                      </select>
                  </div>

                  <div className="search-input-container">
                      <input
                          type="text"
                          placeholder={`Search ${friends.length} friends...`}
                          value={searchTerm}
                          onChange={handleSearchChange}
                      />
                  </div>

                  {friends.length > 0 ? (
                      <ul>
                          {filteredFriends.map((friend) => {
                              const currentAlias = config.aliases[friend.nsaId] || '';

                              return (
                                  <li key={friend.id} className="friend-list-item">
                                      <div className="friend-header">
                                          {getFriendStatus(friend)}<strong style={{marginLeft:"5px"}}>| {friend.name}</strong>

                                          {isGame(friend.presence.game) && friend.presence.game.name && (
                                              <span className="playing-game">
                                                  - Playing {friend.presence.game.name}
                                              </span>
                                          )}
                                      </div>

                                      <div className="friend-config-options">

                                          {/* Watched Checkbox */}
                                          <div className="friend-option-group">
                                              <label htmlFor={`watched-${friend.id}`}>Watched</label>
                                              <input
                                                  type="checkbox"
                                                  id={`watched-${friend.id}`}
                                                  checked={config.watched.includes(friend.nsaId)}
                                                  onChange={(e) => handleWatchedToggle(friend.nsaId, e.target.checked)}
                                              />
                                          </div>

                                          {/* Alias Text Input */}
                                          <div className="friend-option-group alias-input">
                                              <label htmlFor={`alias-${friend.id}`}>Alias</label>
                                              <input
                                                  type="text"
                                                  id={`alias-${friend.id}`}
                                                  value={currentAlias}
                                                  placeholder={friend.name}
                                                  onChange={(e) => handleAliasChange(friend.nsaId, e.target.value)}
                                              />
                                          </div>
                                      </div>
                                  </li>
                              );
                          })}
                      </ul>
                  ) : (
                      <p>Please load the friends JSON file.</p>
                  )}
                  {/* Display message if filtering results in no matches */}
                  {friends.length > 0 && filteredFriends.length === 0 && (
                      <p>No friends found matching your search or filter criteria.</p>
                  )}
              </div>
          </div>
      </>
  );

  return (
    <>
      {/* GLOBAL APPLICATION HEADER (New Element) */}
      <header className="app-header">
          <h1>Friend Watch Configuration</h1>
          <button 
              onClick={view === 'config' ? showAbout : showConfig} 
              className="about-button"
          >
              {view === 'config' ? 'About' : 'Back to Config'}
          </button>
      </header>
      
      {/* CONDITIONAL RENDERING */}
      {view === 'config' ? renderConfigView() : <About onBackClick={showConfig} />}
    </>
  );
}

export default App;