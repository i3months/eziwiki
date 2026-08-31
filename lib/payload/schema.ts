/**
 * JSON Schema definition for payload validation
 */
export const payloadSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['global'],
  properties: {
    global: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'description'],
      properties: {
        title: { type: 'string', minLength: 1 },
        description: { type: 'string', minLength: 1 },
        favicon: { type: 'string' },
        lang: { type: 'string', minLength: 2 },
        // Deliberately not enumerated: the keys are a TypeScript concern, and
        // repeating them here would mean a new string could be added in one
        // place and rejected in the other.
        strings: { type: 'object', additionalProperties: { type: 'string' } },
        baseUrl: { type: 'string', format: 'uri' },
        repoUrl: { type: 'string', format: 'uri' },
        editBranch: { type: 'string', minLength: 1 },
        // Not `format: 'uri'`: the braces in the `{path}` placeholder are not
        // valid in a URI, so the documented value failed validation and no
        // wiki that set this could build.
        editUrl: { type: 'string', pattern: '^https?://\\S*\\{path\\}\\S*$' },
        urlStrategy: { type: 'string', enum: ['path', 'hash'] },
        autoNavigation: { type: 'boolean' },
        seo: {
          type: 'object',
          properties: {
            openGraph: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['url'],
                    properties: {
                      url: { type: 'string' },
                      width: { type: 'number' },
                      height: { type: 'number' },
                      alt: { type: 'string' },
                    },
                  },
                },
              },
            },
            twitter: {
              type: 'object',
              properties: {
                card: {
                  type: 'string',
                  enum: ['summary', 'summary_large_image', 'app', 'player'],
                },
                site: { type: 'string' },
                creator: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                images: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    navigation: {
      type: 'array',
      items: {
        $ref: '#/definitions/navigationItem',
      },
    },
    documents: {
      type: 'object',
      additionalProperties: false,
      properties: {
        raster: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        },
      },
    },
    theme: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        secondary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        background: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        text: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        sidebarBg: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        codeBg: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
      },
    },
  },
  definitions: {
    navigationItem: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1 },
        path: { type: 'string' },
        icon: { type: 'string' },
        color: { type: 'string' },
        hidden: { type: 'boolean' },
        children: {
          type: 'array',
          items: { $ref: '#/definitions/navigationItem' },
        },
      },
    },
  },
};
