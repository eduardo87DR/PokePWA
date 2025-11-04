self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon } = event.data;
    self.registration.showNotification(title || "Pokédex actualizada", {
      body: body || "¡Atrápalos ya!",
      icon: icon || "/icons/pokeball.png",
      vibrate: [200, 100, 200],
      tag: "poke-notify"
    });
  }
});
