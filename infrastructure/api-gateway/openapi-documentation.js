import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * OpenAPI Documentation Generator
 * Generates comprehensive API documentation with interactive exploration
 */
export class OpenAPIDocumentationSystem {
  constructor(config = {}) {
    this.config = {
      title: 'MerajutASA.id API',
      version: '1.0.0',
      description: 'Enterprise API for MerajutASA.id governance and integrity platform',
      servers: [
        { url: 'http://localhost:8080', description: 'Development' },
        { url: 'https://api.merajutasa.id', description: 'Production' },
      ],
      contact: {
        name: 'MerajutASA.id API Team',
        email: 'api@merajutasa.id',
        url: 'https://merajutasa.id',
      },
      license: {
        name: 'UNLICENSED',
        url: 'https://merajutasa.id/license',
      },
      outputDir: 'docs/api',
      ...config,
    };

    this.spec = this.initializeSpec();
    this.endpoints = new Map();
    this.schemas = new Map();
  }

  initializeSpec() {
    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license,
      },
      servers: this.config.servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
        responses: {
          Error: {
            description: 'Error response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    requestId: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          Unauthorized: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Unauthorized' },
                    requestId: { type: 'string' },
                  },
                },
              },
            },
          },
          RateLimitExceeded: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Too many requests' },
                    retryAfter: { type: 'integer', example: 900 },
                  },
                },
              },
            },
          },
        },
      },
      security: [
        { BearerAuth: [] },
        { ApiKeyAuth: [] },
      ],
    };
  }

  /**
   * Register API endpoints from existing services
   */
  registerServiceEndpoints() {
    // Signer Service Endpoints
    this.addEndpoint('/api/v1/signer/pubkey', 'get', {
      summary: 'Get signer public key',
      description: 'Retrieve the public key used for digital signing',
      tags: ['Signer'],
      responses: {
        '200': {
          description: 'Public key retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  publicKeyPem: { type: 'string', description: 'PEM-formatted public key' },
                  algorithm: { type: 'string', example: 'RS256' },
                  keyId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    });

    this.addEndpoint('/api/v1/signer/sign', 'post', {
      summary: 'Sign a payload',
      description: 'Create a digital signature for the provided payload',
      tags: ['Signer'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['payload'],
              properties: {
                payload: {
                  type: 'string',
                  description: 'Data to be signed (base64 encoded)',
                },
                format: {
                  type: 'string',
                  enum: ['base64', 'hex'],
                  default: 'base64',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Signature created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  canonical: { type: 'string', description: 'Canonical representation' },
                  hash_sha256: { type: 'string', description: 'SHA-256 hash' },
                  signature: { type: 'string', description: 'Digital signature' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    });

    // Chain Service Endpoints
    this.addEndpoint('/api/v1/chain/append', 'post', {
      summary: 'Append to integrity chain',
      description: 'Add a new entry to the integrity chain',
      tags: ['Chain'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['canonical', 'signature', 'publicKeyPem'],
              properties: {
                canonical: { type: 'string', description: 'Canonical data' },
                signature: { type: 'string', description: 'Digital signature' },
                publicKeyPem: { type: 'string', description: 'Public key in PEM format' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Entry appended successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  entryId: { type: 'string' },
                  blockHeight: { type: 'integer' },
                  hash: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    });

    this.addEndpoint('/api/v1/chain/head', 'get', {
      summary: 'Get chain head',
      description: 'Retrieve the latest chain entry',
      tags: ['Chain'],
      responses: {
        '200': {
          description: 'Chain head retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  height: { type: 'integer' },
                  hash: { type: 'string' },
                  prevHash: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  entries: { type: 'integer', description: 'Total entries in chain' },
                },
              },
            },
          },
        },
      },
    });

    // Collector Service Endpoints
    this.addEndpoint('/api/v1/collector/ingest', 'post', {
      summary: 'Ingest event data',
      description: 'Submit event data for processing and analysis',
      tags: ['Collector'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['event_type', 'data'],
              properties: {
                event_type: {
                  type: 'string',
                  enum: ['user_action', 'system_event', 'governance_action'],
                  description: 'Type of event being submitted',
                },
                data: {
                  type: 'object',
                  description: 'Event payload data',
                },
                metadata: {
                  type: 'object',
                  properties: {
                    source: { type: 'string' },
                    version: { type: 'string' },
                    correlation_id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Event ingested successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  event_id: { type: 'string' },
                  event_hash: { type: 'string' },
                  processed_at: { type: 'string', format: 'date-time' },
                  status: { type: 'string', enum: ['accepted', 'processed', 'rejected'] },
                },
              },
            },
          },
        },
      },
    });

    // Gateway Management Endpoints
    this.addEndpoint('/health', 'get', {
      summary: 'Gateway health check',
      description: 'Check the health status of the API gateway',
      tags: ['Management'],
      responses: {
        '200': {
          description: 'Gateway is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded'] },
                  version: { type: 'string' },
                  uptime: { type: 'integer', description: 'Uptime in milliseconds' },
                  services: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of registered services',
                  },
                },
              },
            },
          },
        },
      },
    });

    this.addEndpoint('/metrics', 'get', {
      summary: 'Gateway metrics',
      description: 'Retrieve operational metrics from the API gateway',
      tags: ['Management'],
      responses: {
        '200': {
          description: 'Metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gateway: {
                    type: 'object',
                    properties: {
                      requests: { type: 'integer' },
                      errors: { type: 'integer' },
                      errorRate: { type: 'number' },
                      avgLatency: { type: 'number' },
                      p95Latency: { type: 'number' },
                      p99Latency: { type: 'number' },
                    },
                  },
                  services: { type: 'object' },
                },
              },
            },
          },
        },
      },
    });

    this.addEndpoint('/services', 'get', {
      summary: 'List available services',
      description: 'Get information about all registered microservices',
      tags: ['Management'],
      responses: {
        '200': {
          description: 'Services list retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        version: { type: 'string' },
                        endpoint: { type: 'string' },
                        health: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  addEndpoint(path, method, spec) {
    if (!this.spec.paths[path]) {
      this.spec.paths[path] = {};
    }

    // Add common error responses
    if (!spec.responses['400']) {
      spec.responses['400'] = { $ref: '#/components/responses/Error' };
    }
    if (!spec.responses['401']) {
      spec.responses['401'] = { $ref: '#/components/responses/Unauthorized' };
    }
    if (!spec.responses['429']) {
      spec.responses['429'] = { $ref: '#/components/responses/RateLimitExceeded' };
    }
    if (!spec.responses['500']) {
      spec.responses['500'] = { $ref: '#/components/responses/Error' };
    }

    this.spec.paths[path][method] = spec;
    this.endpoints.set(`${method.toUpperCase()} ${path}`, spec);
  }

  addSchema(name, schema) {
    this.spec.components.schemas[name] = schema;
    this.schemas.set(name, schema);
  }

  async generateDocumentation() {
    // Register all service endpoints
    this.registerServiceEndpoints();

    // Add common schemas
    this.addCommonSchemas();

    // Generate OpenAPI specification file
    await this.writeOpenAPISpec();

    // Generate HTML documentation
    await this.generateHTMLDocs();

    // Generate Markdown documentation
    await this.generateMarkdownDocs();

    return {
      spec: this.spec,
      endpoints: this.endpoints.size,
      schemas: this.schemas.size,
      outputDir: this.config.outputDir,
    };
  }

  addCommonSchemas() {
    this.addSchema('ErrorResponse', {
      type: 'object',
      required: ['error', 'requestId'],
      properties: {
        error: { type: 'string', description: 'Error message' },
        requestId: { type: 'string', description: 'Unique request identifier' },
        timestamp: { type: 'string', format: 'date-time' },
        details: { type: 'object', description: 'Additional error details' },
      },
    });

    this.addSchema('SuccessResponse', {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['success'] },
        data: { type: 'object', description: 'Response data' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    });

    this.addSchema('PaginationMeta', {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        total: { type: 'integer', minimum: 0 },
        totalPages: { type: 'integer', minimum: 0 },
      },
    });
  }

  async writeOpenAPISpec() {
    const outputPath = path.join(this.config.outputDir, 'openapi.json');
    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(this.spec, null, 2));

    // Also write YAML version
    const yamlContent = this.convertToYAML(this.spec);
    await fs.writeFile(path.join(this.config.outputDir, 'openapi.yaml'), yamlContent);
  }

  async generateHTMLDocs() {
    const htmlContent = this.generateSwaggerUI();
    await fs.writeFile(path.join(this.config.outputDir, 'index.html'), htmlContent);
  }

  async generateMarkdownDocs() {
    const mdContent = this.generateMarkdownContent();
    await fs.writeFile(path.join(this.config.outputDir, 'API_DOCUMENTATION.md'), mdContent);
  }

  generateSwaggerUI() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.title} - API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { background-color: #1565C0; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
      });
    };
  </script>
</body>
</html>`;
  }

  generateMarkdownContent() {
    const endpoints = Array.from(this.endpoints.entries());

    return `# ${this.config.title}

${this.config.description}

**Version:** ${this.config.version}

## Base URLs

${this.config.servers.map(server => `- **${server.description}:** ${server.url}`).join('\n')}

## Authentication

This API supports multiple authentication methods:

- **Bearer Token:** Include JWT token in Authorization header
- **API Key:** Include API key in X-API-Key header

## Rate Limiting

- **Global limit:** 1000 requests per 15 minutes per IP
- **Service-specific limits:** 500 requests per 15 minutes per service

## Endpoints

${endpoints.map(([path, spec]) => {
    const [method, endpoint] = path.split(' ');
    return `### ${method} ${endpoint}

**Summary:** ${spec.summary || 'No summary'}

**Description:** ${spec.description || 'No description'}

**Tags:** ${spec.tags ? spec.tags.join(', ') : 'None'}

**Responses:**
${Object.entries(spec.responses).map(([code, response]) =>
    `- **${code}:** ${response.description || response.$ref || 'No description'}`,
  ).join('\n')}
`;
  }).join('\n')}

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "error": "Error description",
  "requestId": "unique-request-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## Contact

- **Team:** ${this.config.contact.name}
- **Email:** ${this.config.contact.email}
- **Website:** ${this.config.contact.url}
`;
  }

  convertToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.convertToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.convertToYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
      }
    }

    return yaml;
  }

  getDocumentationSummary() {
    return {
      title: this.config.title,
      version: this.config.version,
      totalEndpoints: this.endpoints.size,
      totalSchemas: this.schemas.size,
      services: [...new Set(Array.from(this.endpoints.values()).flatMap(spec => spec.tags || []))],
      outputFiles: [
        'openapi.json',
        'openapi.yaml',
        'index.html',
        'API_DOCUMENTATION.md',
      ],
    };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      endpoints: this.endpoints.size,
      schemas: this.schemas.size,
      lastGenerated: new Date().toISOString(),
    };
  }
}

/**
 * Factory function for OpenAPI Documentation System
 */
export function createOpenAPISystem(config = {}) {
  return new OpenAPIDocumentationSystem(config);
}

/**
 * Default instance getter
 */
let defaultDocSystem = null;

export function getOpenAPISystem(config = {}) {
  if (!defaultDocSystem) {
    defaultDocSystem = new OpenAPIDocumentationSystem(config);
  }
  return defaultDocSystem;
}
