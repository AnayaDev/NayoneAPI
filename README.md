# Theresa Api UI

A modern, clean, and user-friendly interface for browsing and testing Falcon API endpoints.

![Theresa API UI Screenshot](image.png)

## Features

- 🔍 **Smart Search**: Quickly find endpoints by name or description
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🔄 **API Status Indicators**: Visual indicators showing the status of each endpoint (ready, error, update)
- 📋 **Copy to Clipboard**: One-click copying of API endpoints and responses
- 📊 **JSON Highlighting**: Beautifully formatted JSON responses with syntax highlighting
- 📝 **Detailed Parameter Forms**: Clearly labeled input fields with tooltips for parameter descriptions

## Getting Started

### Prerequisites

- Web server (Apache, Nginx, etc.)
- Modern web browser

### Installation

1. Clone this repository to your web server:
   ```bash
   git clone https://github.com/Z7-zhen/theresa.git
   ```

2. Configure your API endpoints in `openapi.json` (see Configuration section below)

3. Access the UI through your web server (e.g., `https://your-domain.com/theresa-api-ui/`)

## Configuration

All API endpoints and categories are configured in the `openapi.json` file. The structure is as follows:

```json
{
  "openapi": "1.0.0",
  "info": {
    "title": "Theresa",
    "author": "Z7:林企业",
    "version": "v1.0.0",
    "description": "Simple and easy to use API."
  },
  "servers": [
    {
      "url": "/"
    }
  ],
  "tags": [
    {
      "name": "Image"
    },
    {
      "name": "Search Tools"
    }
  ],
  "paths": {
    "/image/ba": {
      "get": {
        "summary": "Blue Archive",
        "description": "Blue Archive Random Images",
        "tags": ["Image"],
        "responses": {
          "200": {
            "description": "Respon berhasil",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "boolean",
                      "example": true
                    },
                    "images": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "format": "uri"
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Gagal memproses request"
          }
        }
      }
    },

    "/search/youtube": {
      "get": {
        "summary": "YouTube Search",
        "description": "Video search",
        "tags": ["Search Tools"],
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "description": "Search query",
            "schema": {
              "type": "string",
              "minLength": 1
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil pencarian YouTube",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "boolean",
                      "example": true
                    },
                    "results": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Query tidak valid"
          },
          "500": {
            "description": "Gagal memproses request"
          }
        }
      }
    }
  }
}
```

### Adding a New Endpoint

To add a new endpoint:

1. Find the appropriate category in the `categories` array or create a new one
2. Add a new object to the `items` array with the following properties:
   - `name`: Display name of the endpoint
   - `desc`: Brief description of what the endpoint does
   - `path`: The API path, including any query parameters
   - `status`: Status of the endpoint (`"ready"`, `"error"`, or `"update"`)
   - `params`: Object containing parameter names as keys and descriptions as values

Example:
```json
{
  "name": "User Info",
  "description": "Get user information by ID",
  "endpoint": {
    "path": "/api/user",
    "method": "GET"
  },
  "status": "ready",
  "params": [
    {
      "name": "id",
      "type": "string",
      "required": true,
      "description": "User ID number",
      "example": "123456789"
    }
  ],
  "examples": {
    "request_url": "/api/user?id=123456789",
    "response": {
      "status": true,
      "user": {
        "id": "123456789",
        "name": "Theresa User",
        "premium": true
      }
    }
  }
}
```

## Customization

### Theme Colors

You can customize the colors by modifying the CSS variables in the `styles.css` file:

```css
:root {
  --primary-color: #4361ee;
  --secondary-color: #3a86ff;
  --accent-color: #4cc9f0;
  /* Additional color variables... */
}
```

### Banner Image

Change the banner image by updating the `bannerImage` property in `openapi.json`:

```json
{
  "bannerImage": "/path/to/your/banner .jpg"
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Font Awesome](https://fontawesome.com/) for icons
- [Bootstrap](https://getbootstrap.com/) for layout components
- [Inter Font](https://fonts.google.com/specimen/Inter) for typography

---

Created with ❤️ by FlowFalcon
Recode by Z7:林企业 (https://github.com/Reyz2902)
