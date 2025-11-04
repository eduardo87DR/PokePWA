import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(
    Notification.permission
  );

  // === Pedir permiso para notificaciones ===
  const solicitarPermisoNotificaciones = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((resultado) => {
        console.log("Permiso de notificación:", resultado);
        setPermisoNotificaciones(resultado);
      });
    }
  };

  // === Obtener lista de Pokémon ===
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=15")
      .then((res) => res.json())
      .then((data) => {
        const detallesPromises = data.results.map((poke) =>
          fetch(poke.url).then((res) => res.json())
        );
        Promise.all(detallesPromises).then((detalles) => setPokemonList(detalles));
      })
      .catch((err) => console.error("Error cargando Pokémon:", err));
  }, []);

  // === Enviar notificación al hacer clic ===
  const enviarNotificacion = async (nombre, imagen) => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title: "¡Pokémon descubierto!",
        body: `Has visto a ${nombre}!`,
        icon: imagen,
      });
    }
  };

  return (
    <div className="AppWrapper">
      <div className="App">
        <h1 className="app-title">PokePWA</h1>

        {permisoNotificaciones !== "granted" && (
          <button
            className="notif-btn"
            onClick={solicitarPermisoNotificaciones}
          >
            Activar notificaciones
          </button>
        )}

        <h2 className="section-title">Pokémon disponibles</h2>

        <div className="poke-container">
          {pokemonList.length > 0 ? (
            pokemonList.map((poke) => (
              <div
                key={poke.id}
                className="poke-card"
                onClick={() =>
                  enviarNotificacion(
                    poke.name.charAt(0).toUpperCase() + poke.name.slice(1),
                    poke.sprites.other["official-artwork"].front_default
                  )
                }
              >
                <img
                  src={poke.sprites.other["official-artwork"].front_default}
                  alt={poke.name}
                  className="poke-img"
                />
                <span className="poke-name">
                  {poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}
                </span>
              </div>
            ))
          ) : (
            <p className="loading-text">Cargando Pokémon...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
