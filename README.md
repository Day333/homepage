# Homepage

https://day333.github.io/homepage/

Research by application area: `pages/research.html`.

Selected publications are maintained in `data/publications.json`. Each entry's
`researchArea` assigns it to a category. Category descriptions and additional
works from Google Scholar are maintained in `data/research.json`.

The homepage's Academic Service section links to `pages/reviewer-certificates.html`,
a gallery for all reviewer certificates. The current IEEE SMC 2026 certificate's
preview and original PDF are stored under `assets/certificates/`. Add future
certificates to the same gallery as additional `certificate-entry` articles, with
their previews and original files in `assets/certificates/`.

The homepage footer includes a live whos.amung.us visitor map. Its dedicated site
ID is `2c7bohuaex`; the map configuration is in `index.html` and the layout is in
`homepage.css`. The official widget loads asynchronously over HTTPS and links to
https://whos.amung.us/stats/2c7bohuaex/ for detailed statistics. It records visits
to the homepage from the time the widget is deployed; it does not import earlier
traffic or record visits made only to the other pages. No account or API key is
required. The map needs JavaScript and access to whos.amung.us; the statistics
link remains available if the widget is blocked.
