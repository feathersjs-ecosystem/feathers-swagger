window.onload = function () {
  const searchParams = new URLSearchParams(window.location.search);

  let url = 'https://petstore3.swagger.io/api/v3/openapi.json';
  if (searchParams.has('url')) {
    url = searchParams.get('url');
  }

  /* global SwaggerUIBundle, SwaggerUIStandalonePreset */
  window.ui = SwaggerUIBundle({
    url,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: 'StandaloneLayout'
  });
};
