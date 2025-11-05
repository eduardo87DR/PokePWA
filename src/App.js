import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [todosLosPokemons, setTodosLosPokemons] = useState([]);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(Notification.permission);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const limite = 20;

  // === Pedir permiso para notificaciones ===
  const solicitarPermisoNotificaciones = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((resultado) => {
        console.log("Permiso de notificación:", resultado);
        setPermisoNotificaciones(resultado);
      });
    }
  };

  // === Cargar todos los nombres y URLs ===
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=10000")
      .then((res) => res.json())
      .then((data) => setTodosLosPokemons(data.results))
      .catch((err) => console.error("Error cargando lista de Pokémon:", err));
  }, []);

  // === Cargar los Pokémon de la página actual o buscados ===
  useEffect(() => {
    const listaBase = busqueda
      ? todosLosPokemons.filter((p) =>
          p.name.toLowerCase().includes(busqueda.toLowerCase())
        )
      : todosLosPokemons;

    const total = Math.ceil(listaBase.length / limite);
    setTotalPaginas(total);

    const inicio = (pagina - 1) * limite;
    const seleccionados = listaBase.slice(inicio, inicio + limite);

    if (seleccionados.length > 0) {
      const detallesPromises = seleccionados.map((poke) =>
        fetch(poke.url).then((res) => res.json())
      );
      Promise.all(detallesPromises)
        .then((detalles) => setPokemonList(detalles))
        .catch((err) => console.error("Error obteniendo detalles:", err));
    } else {
      setPokemonList([]);
    }
  }, [todosLosPokemons, pagina, busqueda]);

  // === Notificación ===
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
    <div className="main-wrapper">
      {/* HEADER */}
      <header className="header">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pokémon_logo.svg"
          alt="Pokémon logo"
          className="logo"
        />
        <nav className="nav-links">
          <a href="#home">Inicio</a>
          <a href="#pokedex">Pokédex</a>
          <a href="#contact">Contacto</a>
        </nav>
      </header>

      {/* BANNER */}
      <section className="banner">
        <h1>¡Bienvenido a PokePWA!</h1>
        <p>
          Explora el mundo Pokémon de manera rápida y ligera. Descubre tus Pokémon favoritos
          y recibe notificaciones al encontrarlos.  
          ¡Atrápalos a todos desde cualquier dispositivo!
        </p>
        {permisoNotificaciones !== "granted" && (
          <button className="notif-btn" onClick={solicitarPermisoNotificaciones}>
            Activar notificaciones
          </button>
        )}
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <main id="pokedex" className="content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar Pokémon..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1); // Reiniciar paginación al buscar
            }}
          />
        </div>

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

        {/* PAGINACIÓN */}
        <div className="pagination">
          <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
            ◀ Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas || 1}
          </span>
          <button
            disabled={pagina === totalPaginas || totalPaginas === 0}
            onClick={() => setPagina(pagina + 1)}
          >
            Siguiente ▶
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 PokePWA - Proyecto educativo inspirado en Pokémon</p>
        <p>
          Datos obtenidos desde{" "}
          <a href="https://pokeapi.co" target="_blank" rel="noreferrer">
            PokéAPI
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
