import { defineConfig } from 'orval'

// Generates typed TanStack Query hooks from the NestJS OpenAPI spec.
// The API writes ../api/openapi.json on startup; run `pnpm api:gen` afterwards.
export default defineConfig({
  api: {
    input: { target: '../api/openapi.json' },
    output: {
      mode: 'tags-split', // one folder per Swagger tag: auth/, expenses/, ...
      target: 'src/api/generated',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      // By default GET endpoints become useQuery hooks and POST/PATCH/PUT/DELETE become useMutation hooks.
      override: {
        // Every request goes through our axios instance (base URL + JWT header).
        mutator: { path: 'src/api/axios-instance.ts', name: 'customInstance' },
      },
    },
  },
})
