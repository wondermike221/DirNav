# DirNav UI - Usage Examples

This document provides comprehensive examples for different use cases and scenarios.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Advanced Directory Structures](#advanced-directory-structures)
- [Virtual Directory Examples](#virtual-directory-examples)
- [Input Node Examples](#input-node-examples)
- [Action Node Examples](#action-node-examples)
- [Real-World Use Cases](#real-world-use-cases)
- [Integration Examples](#integration-examples)
- [Customization Examples](#customization-examples)

## Basic Examples

### Simple File Browser

```typescript
import { DirnavUI, createDirTree } from 'solid-dirnav-ui';

const fileBrowserTree = createDirTree({
  "documents": {
    type: 'directory',
    children: {
      "work": {
        type: 'directory',
        children: {
          "project1": {
            type: 'directory',
            children: {
              "readme.md": {
                type: 'action',
                action: () => window.open('/files/readme.md', '_blank')
              },
              "src": {
                type: 'directory',
                children: {
                  "main.js": {
                    type: 'action',
                    action: () => console.log('Opening main.js')
                  }
                }
              }
            }
          }
        }
      },
      "personal": {
        type: 'directory',
        children: {
          "photos": {
            type: 'action',
            action: () => alert('Opening photo gallery')
          },
          "notes.txt": {
            type: 'action',
            action: () => window.open('/files/notes.txt', '_blank')
          }
        }
      }
    }
  },
  "downloads": {
    type: 'directory',
    children: {
      "recent": {
        type: 'virtual-directory',
        onSelect: async () => {
          const response = await fetch('/api/recent-downloads');
          const files = await response.json();
          
          const children = {};
          files.forEach(file => {
            children[file.name] = {
              type: 'action',
              action: () => window.open(file.url, '_blank')
            };
          });
          
          return createDirTree(children);
        }
      }
    }
  }
});

// Render the component
<DirnavUI initialTree={fileBrowserTree} />
```

### Application Launcher

```typescript
const appLauncherTree = createDirTree({
  "productivity": {
    type: 'directory',
    children: {
      "text_editor": {
        type: 'action',
        action: () => window.open('https://code.visualstudio.com/docs/editor/vscode-web', '_blank')
      },
      "calculator": {
        type: 'action',
        action: () => {
          const calc = window.open('', 'calculator', 'width=300,height=400');
          calc.document.write(`
            <html>
              <head><title>Calculator</title></head>
              <body>
                <div style="padding: 20px;">
                  <input type="text" id="display" style="width: 100%; font-size: 18px;" readonly>
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 10px;">
                    <button onclick="clearDisplay()">C</button>
                    <button onclick="appendToDisplay('/')">/</button>
                    <button onclick="appendToDisplay('*')">*</button>
                    <button onclick="deleteLast()">←</button>
                    <button onclick="appendToDisplay('7')">7</button>
                    <button onclick="appendToDisplay('8')">8</button>
                    <button onclick="appendToDisplay('9')">9</button>
                    <button onclick="appendToDisplay('-')">-</button>
                    <button onclick="appendToDisplay('4')">4</button>
                    <button onclick="appendToDisplay('5')">5</button>
                    <button onclick="appendToDisplay('6')">6</button>
                    <button onclick="appendToDisplay('+')">+</button>
                    <button onclick="appendToDisplay('1')">1</button>
                    <button onclick="appendToDisplay('2')">2</button>
                    <button onclick="appendToDisplay('3')">3</button>
                    <button onclick="calculate()" style="grid-row: span 2;">=</button>
                    <button onclick="appendToDisplay('0')" style="grid-column: span 2;">0</button>
                    <button onclick="appendToDisplay('.')">.</button>
                  </div>
                </div>
                <script>
                  function appendToDisplay(value) {
                    document.getElementById('display').value += value;
                  }
                  function clearDisplay() {
                    document.getElementById('display').value = '';
                  }
                  function deleteLast() {
                    const display = document.getElementById('display');
                    display.value = display.value.slice(0, -1);
                  }
                  function calculate() {
                    try {
                      const result = eval(document.getElementById('display').value);
                      document.getElementById('display').value = result;
                    } catch (e) {
                      alert('Invalid expression');
                    }
                  }
                </script>
              </body>
            </html>
          `);
        }
      },
      "notes": {
        type: 'action',
        action: () => {
          const notes = window.open('', 'notes', 'width=600,height=400');
          notes.document.write(`
            <html>
              <head><title>Quick Notes</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Quick Notes</h2>
                <textarea id="notepad" style="width: 100%; height: 300px; font-size: 14px;" 
                          placeholder="Start typing your notes here..."></textarea>
                <div style="margin-top: 10px;">
                  <button onclick="saveNotes()">Save</button>
                  <button onclick="loadNotes()">Load</button>
                  <button onclick="clearNotes()">Clear</button>
                </div>
                <script>
                  function saveNotes() {
                    localStorage.setItem('quickNotes', document.getElementById('notepad').value);
                    alert('Notes saved!');
                  }
                  function loadNotes() {
                    const saved = localStorage.getItem('quickNotes');
                    if (saved) {
                      document.getElementById('notepad').value = saved;
                    } else {
                      alert('No saved notes found');
                    }
                  }
                  function clearNotes() {
                    if (confirm('Clear all notes?')) {
                      document.getElementById('notepad').value = '';
                    }
                  }
                  // Auto-load on open
                  loadNotes();
                </script>
              </body>
            </html>
          `);
        }
      }
    }
  },
  "entertainment": {
    type: 'directory',
    children: {
      "youtube": {
        type: 'action',
        action: () => window.open('https://youtube.com', '_blank')
      },
      "spotify": {
        type: 'action',
        action: () => window.open('https://open.spotify.com', '_blank')
      },
      "games": {
        type: 'directory',
        children: {
          "2048": {
            type: 'action',
            action: () => window.open('https://play2048.co/', '_blank')
          },
          "chess": {
            type: 'action',
            action: () => window.open('https://lichess.org/', '_blank')
          }
        }
      }
    }
  },
  "settings": {
    type: 'directory',
    children: {
      "homepage": {
        type: 'input',
        localStorageKey: 'user-homepage',
        defaultValue: 'https://google.com'
      },
      "username": {
        type: 'input',
        localStorageKey: 'user-name',
        defaultValue: 'User'
      }
    }
  }
});
```

## Advanced Directory Structures

### Development Environment Navigator

```typescript
const devEnvironmentTree = createDirTree({
  "projects": {
    type: 'virtual-directory',
    onSelect: async () => {
      // Fetch projects from GitHub API
      const response = await fetch('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${localStorage.getItem('github-token')}`
        }
      });
      
      if (!response.ok) {
        return createDirTree({
          "error": {
            type: 'action',
            action: () => alert('Please set your GitHub token in settings')
          }
        });
      }
      
      const repos = await response.json();
      const children = {};
      
      repos.slice(0, 20).forEach(repo => {
        children[repo.name] = {
          type: 'directory',
          children: {
            "open_github": {
              type: 'action',
              action: () => window.open(repo.html_url, '_blank')
            },
            "clone_url": {
              type: 'action',
              action: () => {
                navigator.clipboard.writeText(repo.clone_url);
                alert('Clone URL copied to clipboard!');
              }
            },
            "issues": {
              type: 'virtual-directory',
              onSelect: async () => {
                const issuesResponse = await fetch(repo.issues_url.replace('{/number}', ''));
                const issues = await issuesResponse.json();
                
                const issueChildren = {};
                issues.slice(0, 10).forEach(issue => {
                  issueChildren[`#${issue.number} ${issue.title.substring(0, 30)}`] = {
                    type: 'action',
                    action: () => window.open(issue.html_url, '_blank')
                  };
                });
                
                return createDirTree(issueChildren);
              }
            }
          }
        };
      });
      
      return createDirTree(children);
    }
  },
  "tools": {
    type: 'directory',
    children: {
      "code_editors": {
        type: 'directory',
        children: {
          "vscode_web": {
            type: 'action',
            action: () => window.open('https://vscode.dev', '_blank')
          },
          "codepen": {
            type: 'action',
            action: () => window.open('https://codepen.io', '_blank')
          },
          "codesandbox": {
            type: 'action',
            action: () => window.open('https://codesandbox.io', '_blank')
          }
        }
      },
      "documentation": {
        type: 'directory',
        children: {
          "mdn": {
            type: 'action',
            action: () => window.open('https://developer.mozilla.org', '_blank')
          },
          "react_docs": {
            type: 'action',
            action: () => window.open('https://react.dev', '_blank')
          },
          "typescript_docs": {
            type: 'action',
            action: () => window.open('https://typescriptlang.org/docs', '_blank')
          }
        }
      },
      "apis": {
        type: 'directory',
        children: {
          "rest_client": {
            type: 'action',
            action: () => {
              const client = window.open('', 'restclient', 'width=800,height=600');
              client.document.write(`
                <html>
                  <head><title>REST Client</title></head>
                  <body style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2>Simple REST Client</h2>
                    <div>
                      <select id="method">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                      <input type="text" id="url" placeholder="Enter URL" style="width: 400px; margin-left: 10px;">
                      <button onclick="sendRequest()">Send</button>
                    </div>
                    <div style="margin-top: 20px;">
                      <h3>Headers</h3>
                      <textarea id="headers" placeholder="Content-Type: application/json" style="width: 100%; height: 100px;"></textarea>
                    </div>
                    <div style="margin-top: 20px;">
                      <h3>Body</h3>
                      <textarea id="body" placeholder="Request body (JSON, etc.)" style="width: 100%; height: 100px;"></textarea>
                    </div>
                    <div style="margin-top: 20px;">
                      <h3>Response</h3>
                      <pre id="response" style="background: #f5f5f5; padding: 10px; height: 200px; overflow: auto;"></pre>
                    </div>
                    <script>
                      async function sendRequest() {
                        const method = document.getElementById('method').value;
                        const url = document.getElementById('url').value;
                        const headersText = document.getElementById('headers').value;
                        const body = document.getElementById('body').value;
                        
                        const headers = {};
                        headersText.split('\\n').forEach(line => {
                          const [key, value] = line.split(':').map(s => s.trim());
                          if (key && value) headers[key] = value;
                        });
                        
                        try {
                          const options = { method, headers };
                          if (body && method !== 'GET') options.body = body;
                          
                          const response = await fetch(url, options);
                          const responseText = await response.text();
                          
                          document.getElementById('response').textContent = 
                            \`Status: \${response.status} \${response.statusText}\\n\\n\${responseText}\`;
                        } catch (error) {
                          document.getElementById('response').textContent = 'Error: ' + error.message;
                        }
                      }
                    </script>
                  </body>
                </html>
              `);
            }
          },
          "json_formatter": {
            type: 'action',
            action: () => {
              const formatter = window.open('', 'jsonformatter', 'width=800,height=600');
              formatter.document.write(`
                <html>
                  <head><title>JSON Formatter</title></head>
                  <body style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2>JSON Formatter & Validator</h2>
                    <div style="display: flex; gap: 20px;">
                      <div style="flex: 1;">
                        <h3>Input</h3>
                        <textarea id="input" placeholder="Paste JSON here..." style="width: 100%; height: 400px;"></textarea>
                        <button onclick="formatJSON()">Format</button>
                        <button onclick="minifyJSON()">Minify</button>
                        <button onclick="validateJSON()">Validate</button>
                      </div>
                      <div style="flex: 1;">
                        <h3>Output</h3>
                        <pre id="output" style="background: #f5f5f5; padding: 10px; height: 400px; overflow: auto; white-space: pre-wrap;"></pre>
                      </div>
                    </div>
                    <script>
                      function formatJSON() {
                        try {
                          const input = document.getElementById('input').value;
                          const parsed = JSON.parse(input);
                          document.getElementById('output').textContent = JSON.stringify(parsed, null, 2);
                        } catch (error) {
                          document.getElementById('output').textContent = 'Error: ' + error.message;
                        }
                      }
                      
                      function minifyJSON() {
                        try {
                          const input = document.getElementById('input').value;
                          const parsed = JSON.parse(input);
                          document.getElementById('output').textContent = JSON.stringify(parsed);
                        } catch (error) {
                          document.getElementById('output').textContent = 'Error: ' + error.message;
                        }
                      }
                      
                      function validateJSON() {
                        try {
                          const input = document.getElementById('input').value;
                          JSON.parse(input);
                          document.getElementById('output').textContent = 'Valid JSON ✓';
                        } catch (error) {
                          document.getElementById('output').textContent = 'Invalid JSON: ' + error.message;
                        }
                      }
                    </script>
                  </body>
                </html>
              `);
            }
          }
        }
      }
    }
  },
  "config": {
    type: 'directory',
    children: {
      "github_token": {
        type: 'input',
        localStorageKey: 'github-token',
        defaultValue: ''
      },
      "default_editor": {
        type: 'input',
        localStorageKey: 'default-editor',
        defaultValue: 'vscode'
      },
      "theme_preference": {
        type: 'input',
        localStorageKey: 'theme-preference',
        defaultValue: 'dark'
      }
    }
  }
});
```

## Virtual Directory Examples

### Dynamic Content Loading

```typescript
// News Feed Example
const newsFeedTree = createDirTree({
  "news": {
    type: 'virtual-directory',
    onSelect: async () => {
      try {
        // Using a news API (replace with your preferred news service)
        const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
        const articles = await response.json();
        
        const children = {};
        articles.forEach((article, index) => {
          children[`${index + 1}. ${article.title.substring(0, 40)}...`] = {
            type: 'directory',
            children: {
              "read_full": {
                type: 'action',
                action: () => {
                  const reader = window.open('', 'article', 'width=600,height=400');
                  reader.document.write(`
                    <html>
                      <head><title>${article.title}</title></head>
                      <body style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
                        <h1>${article.title}</h1>
                        <p><strong>Article ID:</strong> ${article.id}</p>
                        <div style="margin-top: 20px;">
                          ${article.body.split('\n').map(p => `<p>${p}</p>`).join('')}
                        </div>
                      </body>
                    </html>
                  `);
                }
              },
              "copy_link": {
                type: 'action',
                action: () => {
                  navigator.clipboard.writeText(`https://jsonplaceholder.typicode.com/posts/${article.id}`);
                  alert('Link copied to clipboard!');
                }
              }
            }
          };
        });
        
        return createDirTree(children);
      } catch (error) {
        return createDirTree({
          "error": {
            type: 'action',
            action: () => alert('Failed to load news: ' + error.message)
          },
          "retry": {
            type: 'virtual-directory',
            onSelect: () => newsFeedTree.news.onSelect()
          }
        });
      }
    }
  },
  "weather": {
    type: 'virtual-directory',
    onSelect: async () => {
      try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const { latitude, longitude } = position.coords;
        
        // Using a weather API (replace with your API key)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=YOUR_API_KEY&units=metric`
        );
        
        if (!response.ok) {
          throw new Error('Weather service unavailable');
        }
        
        const weather = await response.json();
        
        return createDirTree({
          [`${weather.name} - ${weather.weather[0].main}`]: {
            type: 'directory',
            children: {
              "temperature": {
                type: 'action',
                action: () => alert(`Temperature: ${weather.main.temp}°C (feels like ${weather.main.feels_like}°C)`)
              },
              "humidity": {
                type: 'action',
                action: () => alert(`Humidity: ${weather.main.humidity}%`)
              },
              "wind": {
                type: 'action',
                action: () => alert(`Wind: ${weather.wind.speed} m/s`)
              },
              "description": {
                type: 'action',
                action: () => alert(`Weather: ${weather.weather[0].description}`)
              }
            }
          }
        });
      } catch (error) {
        return createDirTree({
          "location_error": {
            type: 'action',
            action: () => alert('Unable to get location or weather data')
          },
          "manual_location": {
            type: 'input',
            localStorageKey: 'manual-location',
            defaultValue: 'Enter city name'
          }
        });
      }
    }
  }
});
```

### Database Browser Example

```typescript
// Simulated database browser
const databaseBrowserTree = createDirTree({
  "databases": {
    type: 'virtual-directory',
    onSelect: async () => {
      // Simulate fetching database list
      const databases = ['users_db', 'products_db', 'orders_db', 'analytics_db'];
      
      const children = {};
      databases.forEach(dbName => {
        children[dbName] = {
          type: 'virtual-directory',
          onSelect: async () => {
            // Simulate fetching tables for this database
            const tables = {
              'users_db': ['users', 'profiles', 'sessions'],
              'products_db': ['products', 'categories', 'inventory'],
              'orders_db': ['orders', 'order_items', 'payments'],
              'analytics_db': ['page_views', 'user_events', 'reports']
            };
            
            const tableChildren = {};
            tables[dbName].forEach(tableName => {
              tableChildren[tableName] = {
                type: 'directory',
                children: {
                  "view_schema": {
                    type: 'action',
                    action: () => {
                      // Simulate schema view
                      const schemas = {
                        'users': 'id (INT), email (VARCHAR), created_at (TIMESTAMP)',
                        'products': 'id (INT), name (VARCHAR), price (DECIMAL), category_id (INT)',
                        'orders': 'id (INT), user_id (INT), total (DECIMAL), status (VARCHAR)'
                      };
                      
                      const schema = schemas[tableName] || 'Schema not available';
                      alert(`Schema for ${tableName}:\n${schema}`);
                    }
                  },
                  "sample_data": {
                    type: 'action',
                    action: () => {
                      // Simulate sample data
                      const sampleData = {
                        'users': [
                          { id: 1, email: 'user1@example.com', created_at: '2023-01-01' },
                          { id: 2, email: 'user2@example.com', created_at: '2023-01-02' }
                        ],
                        'products': [
                          { id: 1, name: 'Widget A', price: 19.99, category_id: 1 },
                          { id: 2, name: 'Widget B', price: 29.99, category_id: 1 }
                        ]
                      };
                      
                      const data = sampleData[tableName] || [{ message: 'No sample data available' }];
                      
                      const viewer = window.open('', 'dataviewer', 'width=800,height=600');
                      viewer.document.write(`
                        <html>
                          <head><title>${tableName} - Sample Data</title></head>
                          <body style="padding: 20px; font-family: Arial, sans-serif;">
                            <h2>${tableName} - Sample Data</h2>
                            <pre style="background: #f5f5f5; padding: 15px; overflow: auto;">
${JSON.stringify(data, null, 2)}
                            </pre>
                          </body>
                        </html>
                      `);
                    }
                  },
                  "export_csv": {
                    type: 'action',
                    action: () => {
                      // Simulate CSV export
                      const csvData = `id,name,value\n1,Sample,123\n2,Data,456`;
                      const blob = new Blob([csvData], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${tableName}_export.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }
                }
              };
            });
            
            return createDirTree(tableChildren);
          }
        };
      });
      
      return createDirTree(children);
    }
  },
  "query_builder": {
    type: 'action',
    action: () => {
      const queryBuilder = window.open('', 'querybuilder', 'width=900,height=700');
      queryBuilder.document.write(`
        <html>
          <head><title>SQL Query Builder</title></head>
          <body style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>SQL Query Builder</h2>
            <div style="margin-bottom: 20px;">
              <label>Table:</label>
              <select id="table" onchange="updateFields()">
                <option value="">Select table...</option>
                <option value="users">users</option>
                <option value="products">products</option>
                <option value="orders">orders</option>
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label>Fields:</label>
              <div id="fields"></div>
            </div>
            <div style="margin-bottom: 20px;">
              <label>Where:</label>
              <input type="text" id="where" placeholder="id = 1" style="width: 300px;">
            </div>
            <div style="margin-bottom: 20px;">
              <label>Order By:</label>
              <input type="text" id="orderby" placeholder="created_at DESC" style="width: 300px;">
            </div>
            <div style="margin-bottom: 20px;">
              <label>Limit:</label>
              <input type="number" id="limit" placeholder="10" style="width: 100px;">
            </div>
            <button onclick="buildQuery()">Build Query</button>
            <button onclick="executeQuery()">Execute</button>
            <div style="margin-top: 20px;">
              <h3>Generated Query:</h3>
              <textarea id="query" style="width: 100%; height: 100px;" readonly></textarea>
            </div>
            <div style="margin-top: 20px;">
              <h3>Results:</h3>
              <pre id="results" style="background: #f5f5f5; padding: 10px; height: 200px; overflow: auto;"></pre>
            </div>
            <script>
              const tableFields = {
                users: ['id', 'email', 'created_at'],
                products: ['id', 'name', 'price', 'category_id'],
                orders: ['id', 'user_id', 'total', 'status']
              };
              
              function updateFields() {
                const table = document.getElementById('table').value;
                const fieldsDiv = document.getElementById('fields');
                
                if (table && tableFields[table]) {
                  fieldsDiv.innerHTML = tableFields[table].map(field => 
                    \`<label><input type="checkbox" value="\${field}" checked> \${field}</label>\`
                  ).join(' ');
                } else {
                  fieldsDiv.innerHTML = '';
                }
                buildQuery();
              }
              
              function buildQuery() {
                const table = document.getElementById('table').value;
                if (!table) return;
                
                const checkboxes = document.querySelectorAll('#fields input[type="checkbox"]:checked');
                const fields = Array.from(checkboxes).map(cb => cb.value).join(', ') || '*';
                
                let query = \`SELECT \${fields} FROM \${table}\`;
                
                const where = document.getElementById('where').value;
                if (where) query += \` WHERE \${where}\`;
                
                const orderBy = document.getElementById('orderby').value;
                if (orderBy) query += \` ORDER BY \${orderBy}\`;
                
                const limit = document.getElementById('limit').value;
                if (limit) query += \` LIMIT \${limit}\`;
                
                document.getElementById('query').value = query;
              }
              
              function executeQuery() {
                // Simulate query execution
                const mockResults = [
                  { id: 1, name: 'Sample Result 1', value: 'Data 1' },
                  { id: 2, name: 'Sample Result 2', value: 'Data 2' }
                ];
                
                document.getElementById('results').textContent = 
                  'Query executed successfully:\\n\\n' + JSON.stringify(mockResults, null, 2);
              }
            </script>
          </body>
        </html>
      `);
    }
  }
});
```

## Input Node Examples

### Configuration Manager

```typescript
const configManagerTree = createDirTree({
  "application": {
    type: 'directory',
    children: {
      "app_name": {
        type: 'input',
        localStorageKey: 'app-name',
        defaultValue: 'My Application'
      },
      "version": {
        type: 'input',
        localStorageKey: 'app-version',
        defaultValue: '1.0.0'
      },
      "debug_mode": {
        type: 'input',
        localStorageKey: 'debug-mode',
        defaultValue: 'false'
      },
      "max_users": {
        type: 'input',
        localStorageKey: 'max-users',
        defaultValue: '100'
      }
    }
  },
  "database": {
    type: 'directory',
    children: {
      "host": {
        type: 'input',
        localStorageKey: 'db-host',
        defaultValue: 'localhost'
      },
      "port": {
        type: 'input',
        localStorageKey: 'db-port',
        defaultValue: '5432'
      },
      "database_name": {
        type: 'input',
        localStorageKey: 'db-name',
        defaultValue: 'myapp_db'
      },
      "username": {
        type: 'input',
        localStorageKey: 'db-username',
        defaultValue: 'admin'
      },
      "connection_pool_size": {
        type: 'input',
        localStorageKey: 'db-pool-size',
        defaultValue: '10'
      }
    }
  },
  "api": {
    type: 'directory',
    children: {
      "base_url": {
        type: 'input',
        localStorageKey: 'api-base-url',
        defaultValue: 'https://api.example.com'
      },
      "timeout": {
        type: 'input',
        localStorageKey: 'api-timeout',
        defaultValue: '30000'
      },
      "rate_limit": {
        type: 'input',
        localStorageKey: 'api-rate-limit',
        defaultValue: '100'
      }
    }
  },
  "actions": {
    type: 'directory',
    children: {
      "export_config": {
        type: 'action',
        action: () => {
          // Collect all configuration values
          const config = {
            application: {
              app_name: localStorage.getItem('app-name'),
              version: localStorage.getItem('app-version'),
              debug_mode: localStorage.getItem('debug-mode') === 'true',
              max_users: parseInt(localStorage.getItem('max-users') || '100')
            },
            database: {
              host: localStorage.getItem('db-host'),
              port: parseInt(localStorage.getItem('db-port') || '5432'),
              database_name: localStorage.getItem('db-name'),
              username: localStorage.getItem('db-username'),
              connection_pool_size: parseInt(localStorage.getItem('db-pool-size') || '10')
            },
            api: {
              base_url: localStorage.getItem('api-base-url'),
              timeout: parseInt(localStorage.getItem('api-timeout') || '30000'),
              rate_limit: parseInt(localStorage.getItem('api-rate-limit') || '100')
            }
          };
          
          const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'app-config.json';
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      "import_config": {
        type: 'action',
        action: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const config = JSON.parse(e.target.result);
                  
                  // Import application settings
                  if (config.application) {
                    Object.entries(config.application).forEach(([key, value]) => {
                      localStorage.setItem(`app-${key.replace('_', '-')}`, value.toString());
                    });
                  }
                  
                  // Import database settings
                  if (config.database) {
                    Object.entries(config.database).forEach(([key, value]) => {
                      localStorage.setItem(`db-${key.replace('_', '-')}`, value.toString());
                    });
                  }
                  
                  // Import API settings
                  if (config.api) {
                    Object.entries(config.api).forEach(([key, value]) => {
                      localStorage.setItem(`api-${key.replace('_', '-')}`, value.toString());
                    });
                  }
                  
                  alert('Configuration imported successfully!');
                } catch (error) {
                  alert('Error importing configuration: ' + error.message);
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }
      },
      "reset_to_defaults": {
        type: 'action',
        action: () => {
          if (confirm('Reset all settings to default values?')) {
            // Clear all configuration keys
            const keys = Object.keys(localStorage).filter(key => 
              key.startsWith('app-') || key.startsWith('db-') || key.startsWith('api-')
            );
            
            keys.forEach(key => localStorage.removeItem(key));
            alert('Configuration reset to defaults!');
          }
        }
      }
    }
  }
});
```

## Action Node Examples

### System Utilities

```typescript
const systemUtilitiesTree = createDirTree({
  "clipboard": {
    type: 'directory',
    children: {
      "copy_timestamp": {
        type: 'action',
        action: () => {
          const timestamp = new Date().toISOString();
          navigator.clipboard.writeText(timestamp);
          alert(`Timestamp copied: ${timestamp}`);
        }
      },
      "copy_uuid": {
        type: 'action',
        action: () => {
          const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          navigator.clipboard.writeText(uuid);
          alert(`UUID copied: ${uuid}`);
        }
      },
      "copy_lorem": {
        type: 'action',
        action: () => {
          const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
          navigator.clipboard.writeText(lorem);
          alert('Lorem ipsum text copied to clipboard!');
        }
      }
    }
  },
  "generators": {
    type: 'directory',
    children: {
      "password_generator": {
        type: 'action',
        action: () => {
          const generator = window.open('', 'passwordgen', 'width=500,height=400');
          generator.document.write(`
            <html>
              <head><title>Password Generator</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Password Generator</h2>
                <div style="margin-bottom: 20px;">
                  <label><input type="checkbox" id="uppercase" checked> Uppercase (A-Z)</label><br>
                  <label><input type="checkbox" id="lowercase" checked> Lowercase (a-z)</label><br>
                  <label><input type="checkbox" id="numbers" checked> Numbers (0-9)</label><br>
                  <label><input type="checkbox" id="symbols"> Symbols (!@#$%^&*)</label><br>
                </div>
                <div style="margin-bottom: 20px;">
                  <label>Length: <input type="number" id="length" value="12" min="4" max="50"></label>
                </div>
                <button onclick="generatePassword()">Generate Password</button>
                <div style="margin-top: 20px;">
                  <input type="text" id="password" readonly style="width: 100%; font-family: monospace; font-size: 16px;">
                </div>
                <button onclick="copyPassword()" style="margin-top: 10px;">Copy to Clipboard</button>
                <script>
                  function generatePassword() {
                    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
                    const numbers = '0123456789';
                    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
                    
                    let chars = '';
                    if (document.getElementById('uppercase').checked) chars += uppercase;
                    if (document.getElementById('lowercase').checked) chars += lowercase;
                    if (document.getElementById('numbers').checked) chars += numbers;
                    if (document.getElementById('symbols').checked) chars += symbols;
                    
                    if (!chars) {
                      alert('Please select at least one character type');
                      return;
                    }
                    
                    const length = parseInt(document.getElementById('length').value);
                    let password = '';
                    
                    for (let i = 0; i < length; i++) {
                      password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    
                    document.getElementById('password').value = password;
                  }
                  
                  function copyPassword() {
                    const password = document.getElementById('password').value;
                    if (password) {
                      navigator.clipboard.writeText(password);
                      alert('Password copied to clipboard!');
                    }
                  }
                  
                  // Generate initial password
                  generatePassword();
                </script>
              </body>
            </html>
          `);
        }
      },
      "color_palette": {
        type: 'action',
        action: () => {
          const palette = window.open('', 'colorpalette', 'width=600,height=500');
          palette.document.write(`
            <html>
              <head><title>Color Palette Generator</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Color Palette Generator</h2>
                <div style="margin-bottom: 20px;">
                  <button onclick="generatePalette('monochromatic')">Monochromatic</button>
                  <button onclick="generatePalette('complementary')">Complementary</button>
                  <button onclick="generatePalette('triadic')">Triadic</button>
                  <button onclick="generatePalette('random')">Random</button>
                </div>
                <div id="palette" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
                <script>
                  function generatePalette(type) {
                    const paletteDiv = document.getElementById('palette');
                    paletteDiv.innerHTML = '';
                    
                    let colors = [];
                    
                    switch(type) {
                      case 'monochromatic':
                        const baseHue = Math.floor(Math.random() * 360);
                        for (let i = 0; i < 5; i++) {
                          const lightness = 20 + (i * 15);
                          colors.push(\`hsl(\${baseHue}, 70%, \${lightness}%)\`);
                        }
                        break;
                      case 'complementary':
                        const hue1 = Math.floor(Math.random() * 360);
                        const hue2 = (hue1 + 180) % 360;
                        colors = [
                          \`hsl(\${hue1}, 70%, 50%)\`,
                          \`hsl(\${hue1}, 70%, 30%)\`,
                          \`hsl(\${hue1}, 70%, 70%)\`,
                          \`hsl(\${hue2}, 70%, 50%)\`,
                          \`hsl(\${hue2}, 70%, 30%)\`
                        ];
                        break;
                      case 'triadic':
                        const baseHue2 = Math.floor(Math.random() * 360);
                        colors = [
                          \`hsl(\${baseHue2}, 70%, 50%)\`,
                          \`hsl(\${(baseHue2 + 120) % 360}, 70%, 50%)\`,
                          \`hsl(\${(baseHue2 + 240) % 360}, 70%, 50%)\`,
                          \`hsl(\${baseHue2}, 70%, 30%)\`,
                          \`hsl(\${baseHue2}, 70%, 70%)\`
                        ];
                        break;
                      case 'random':
                        for (let i = 0; i < 5; i++) {
                          colors.push(\`hsl(\${Math.floor(Math.random() * 360)}, 70%, 50%)\`);
                        }
                        break;
                    }
                    
                    colors.forEach(color => {
                      const colorDiv = document.createElement('div');
                      colorDiv.style.cssText = \`
                        width: 100px;
                        height: 100px;
                        background-color: \${color};
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                        font-size: 12px;
                        text-align: center;
                      \`;
                      
                      // Convert to hex for display
                      const tempDiv = document.createElement('div');
                      tempDiv.style.color = color;
                      document.body.appendChild(tempDiv);
                      const rgbColor = getComputedStyle(tempDiv).color;
                      document.body.removeChild(tempDiv);
                      
                      const hex = rgbToHex(rgbColor);
                      colorDiv.textContent = hex;
                      
                      colorDiv.onclick = () => {
                        navigator.clipboard.writeText(hex);
                        alert(\`Color \${hex} copied to clipboard!\`);
                      };
                      
                      paletteDiv.appendChild(colorDiv);
                    });
                  }
                  
                  function rgbToHex(rgb) {
                    const result = rgb.match(/\\d+/g);
                    if (result) {
                      const r = parseInt(result[0]).toString(16).padStart(2, '0');
                      const g = parseInt(result[1]).toString(16).padStart(2, '0');
                      const b = parseInt(result[2]).toString(16).padStart(2, '0');
                      return \`#\${r}\${g}\${b}\`;
                    }
                    return '#000000';
                  }
                  
                  // Generate initial palette
                  generatePalette('random');
                </script>
              </body>
            </html>
          `);
        }
      }
    }
  },
  "converters": {
    type: 'directory',
    children: {
      "base64_encoder": {
        type: 'action',
        action: () => {
          const converter = window.open('', 'base64', 'width=600,height=400');
          converter.document.write(`
            <html>
              <head><title>Base64 Encoder/Decoder</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Base64 Encoder/Decoder</h2>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <h3>Plain Text</h3>
                    <textarea id="plaintext" placeholder="Enter text to encode..." style="width: 100%; height: 200px;"></textarea>
                    <button onclick="encode()">Encode →</button>
                  </div>
                  <div style="flex: 1;">
                    <h3>Base64</h3>
                    <textarea id="base64" placeholder="Enter base64 to decode..." style="width: 100%; height: 200px;"></textarea>
                    <button onclick="decode()">← Decode</button>
                  </div>
                </div>
                <script>
                  function encode() {
                    const plaintext = document.getElementById('plaintext').value;
                    try {
                      const encoded = btoa(plaintext);
                      document.getElementById('base64').value = encoded;
                    } catch (error) {
                      alert('Error encoding: ' + error.message);
                    }
                  }
                  
                  function decode() {
                    const base64 = document.getElementById('base64').value;
                    try {
                      const decoded = atob(base64);
                      document.getElementById('plaintext').value = decoded;
                    } catch (error) {
                      alert('Error decoding: ' + error.message);
                    }
                  }
                </script>
              </body>
            </html>
          `);
        }
      },
      "url_encoder": {
        type: 'action',
        action: () => {
          const converter = window.open('', 'urlencoder', 'width=600,height=400');
          converter.document.write(`
            <html>
              <head><title>URL Encoder/Decoder</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>URL Encoder/Decoder</h2>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <h3>Plain URL</h3>
                    <textarea id="plainurl" placeholder="Enter URL to encode..." style="width: 100%; height: 200px;"></textarea>
                    <button onclick="encodeURL()">Encode →</button>
                  </div>
                  <div style="flex: 1;">
                    <h3>Encoded URL</h3>
                    <textarea id="encodedurl" placeholder="Enter encoded URL to decode..." style="width: 100%; height: 200px;"></textarea>
                    <button onclick="decodeURL()">← Decode</button>
                  </div>
                </div>
                <script>
                  function encodeURL() {
                    const plainurl = document.getElementById('plainurl').value;
                    try {
                      const encoded = encodeURIComponent(plainurl);
                      document.getElementById('encodedurl').value = encoded;
                    } catch (error) {
                      alert('Error encoding: ' + error.message);
                    }
                  }
                  
                  function decodeURL() {
                    const encodedurl = document.getElementById('encodedurl').value;
                    try {
                      const decoded = decodeURIComponent(encodedurl);
                      document.getElementById('plainurl').value = decoded;
                    } catch (error) {
                      alert('Error decoding: ' + error.message);
                    }
                  }
                </script>
              </body>
            </html>
          `);
        }
      }
    }
  }
});
```

## Real-World Use Cases

### Project Management Dashboard

```typescript
const projectDashboardTree = createDirTree({
  "projects": {
    type: 'virtual-directory',
    onSelect: async () => {
      // This would typically fetch from your project management API
      const projects = [
        { id: 1, name: 'Website Redesign', status: 'In Progress', progress: 75 },
        { id: 2, name: 'Mobile App', status: 'Planning', progress: 25 },
        { id: 3, name: 'API Integration', status: 'Complete', progress: 100 }
      ];
      
      const children = {};
      projects.forEach(project => {
        children[`${project.name} (${project.progress}%)`] = {
          type: 'directory',
          children: {
            "view_details": {
              type: 'action',
              action: () => {
                alert(`Project: ${project.name}\nStatus: ${project.status}\nProgress: ${project.progress}%`);
              }
            },
            "tasks": {
              type: 'virtual-directory',
              onSelect: async () => {
                // Fetch tasks for this project
                const tasks = [
                  { id: 1, title: 'Design mockups', completed: true },
                  { id: 2, title: 'Implement frontend', completed: false },
                  { id: 3, title: 'Backend API', completed: false }
                ];
                
                const taskChildren = {};
                tasks.forEach(task => {
                  taskChildren[`${task.completed ? '✓' : '○'} ${task.title}`] = {
                    type: 'action',
                    action: () => {
                      const newStatus = !task.completed;
                      task.completed = newStatus;
                      alert(`Task "${task.title}" marked as ${newStatus ? 'completed' : 'incomplete'}`);
                    }
                  };
                });
                
                return createDirTree(taskChildren);
              }
            },
            "time_tracking": {
              type: 'directory',
              children: {
                "start_timer": {
                  type: 'action',
                  action: () => {
                    const startTime = Date.now();
                    localStorage.setItem(`timer-${project.id}`, startTime.toString());
                    alert(`Timer started for ${project.name}`);
                  }
                },
                "stop_timer": {
                  type: 'action',
                  action: () => {
                    const startTime = localStorage.getItem(`timer-${project.id}`);
                    if (startTime) {
                      const elapsed = Date.now() - parseInt(startTime);
                      const minutes = Math.floor(elapsed / 60000);
                      localStorage.removeItem(`timer-${project.id}`);
                      alert(`Time logged: ${minutes} minutes for ${project.name}`);
                    } else {
                      alert('No active timer found');
                    }
                  }
                }
              }
            }
          }
        };
      });
      
      return createDirTree(children);
    }
  },
  "team": {
    type: 'virtual-directory',
    onSelect: async () => {
      const team = [
        { name: 'Alice Johnson', role: 'Frontend Developer', status: 'Available' },
        { name: 'Bob Smith', role: 'Backend Developer', status: 'In Meeting' },
        { name: 'Carol Davis', role: 'Designer', status: 'Busy' }
      ];
      
      const children = {};
      team.forEach(member => {
        children[`${member.name} - ${member.status}`] = {
          type: 'directory',
          children: {
            "send_message": {
              type: 'action',
              action: () => {
                const message = prompt(`Send message to ${member.name}:`);
                if (message) {
                  alert(`Message sent to ${member.name}: "${message}"`);
                }
              }
            },
            "view_schedule": {
              type: 'action',
              action: () => {
                alert(`${member.name}'s Schedule:\n9:00 AM - Daily Standup\n10:00 AM - Development Work\n2:00 PM - Code Review\n4:00 PM - Team Meeting`);
              }
            }
          }
        };
      });
      
      return createDirTree(children);
    }
  },
  "reports": {
    type: 'directory',
    children: {
      "generate_status_report": {
        type: 'action',
        action: () => {
          const report = `
Project Status Report - ${new Date().toLocaleDateString()}

Active Projects: 2
Completed Projects: 1
Team Members: 3
Total Hours This Week: 120

Top Priorities:
1. Complete Website Redesign frontend
2. Begin Mobile App development
3. Plan Q2 roadmap
          `;
          
          const reportWindow = window.open('', 'report', 'width=600,height=400');
          reportWindow.document.write(`
            <html>
              <head><title>Status Report</title></head>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <pre style="white-space: pre-wrap;">${report}</pre>
                <button onclick="window.print()">Print Report</button>
              </body>
            </html>
          `);
        }
      },
      "time_summary": {
        type: 'action',
        action: () => {
          alert('Time Summary:\nWebsite Redesign: 45 hours\nMobile App: 20 hours\nAPI Integration: 55 hours\n\nTotal: 120 hours');
        }
      }
    }
  }
});
```

This comprehensive examples document demonstrates the flexibility and power of DirNav UI across various use cases, from simple file browsers to complex project management systems. Each example is fully functional and can be adapted to your specific needs.