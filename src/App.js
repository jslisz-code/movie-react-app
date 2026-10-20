import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import "./App.css";

function MoviePoster({ poster, title }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!poster || poster === "N/A" || imageFailed) {
    return <div className="no-poster">No Poster Available</div>;
  }

  return (
    <img
      src={poster}
      alt={`${title} poster`}
      onError={() => setImageFailed(true)}
    />
  );
}

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [sortOrder, setSortOrder] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const moviesPerPage = 6;

  const searchMovies = async (event) => {
    event.preventDefault();

    if (!searchTerm.trim()) {
      setError("Please enter a movie title.");
      return;
    }

    setLoading(true);
    setError("");
    setCurrentPage(1);

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.REACT_APP_OMDB_API_KEY}&s=${encodeURIComponent(
          searchTerm
        )}`
      );

      const data = await response.json();

      if (data.Response === "True") {
        setMovies(data.Search);
      } else {
        setMovies([]);
        setError(data.Error || "No movies found.");
      }
    } catch (error) {
      setMovies([]);
      setError("Something went wrong while searching for movies.");
    }

    setLoading(false);
  };

  const filteredMovies = movies.filter((movie) => {
    if (typeFilter === "all") {
      return true;
    }

    return movie.Type === typeFilter;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    const yearA = parseInt(a.Year) || 0;
    const yearB = parseInt(b.Year) || 0;

    if (sortOrder === "newest") {
      return yearB - yearA;
    }

    if (sortOrder === "oldest") {
      return yearA - yearB;
    }

    return 0;
  });

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;

  const currentMovies = sortedMovies.slice(
    indexOfFirstMovie,
    indexOfLastMovie
  );

  const totalPages = Math.ceil(
    sortedMovies.length / moviesPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [typeFilter, sortOrder, currentPage, totalPages]);

  return (
    <>
      <section className="hero">
        <h2>Find Your Next Movie</h2>
        <p>Search thousands of movies using the OMDb API.</p>

        <form className="search-bar" onSubmit={searchMovies}>
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <button type="submit">Search</button>
        </form>
      </section>

      <section className="movies-section" id="movies">
        <div className="section-header">
          <h2>Movies</h2>

          <div className="filter-controls">
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
              <option value="episode">Episodes</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Sort by Year</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {loading && <p className="message">Searching...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && movies.length === 0 && (
          <p className="message">
            Search for a movie to get started.
          </p>
        )}

        {!loading &&
          !error &&
          movies.length > 0 &&
          sortedMovies.length === 0 && (
            <p className="message">
              No results match this filter.
            </p>
          )}

        <div className="movies-grid">
          {currentMovies.map((movie) => (
            <Link
              className="movie-card"
              key={movie.imdbID}
              to={`/movie/${movie.imdbID}`}
            >
              <MoviePoster
                poster={movie.Poster}
                title={movie.Title}
              />

              <div className="movie-info">
                <h3>{movie.Title}</h3>
                <p>{movie.Year}</p>
                <span>{movie.Type}</span>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from(
              { length: totalPages },
              (_, index) => (
                <button
                  key={index + 1}
                  className={
                    currentPage === index + 1
                      ? "page-button active"
                      : "page-button"
                  }
                  onClick={() => {
                    setCurrentPage(index + 1);

                    document
                      .getElementById("movies")
                      .scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

function MovieDetails() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getMovieDetails = async () => {
      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${process.env.REACT_APP_OMDB_API_KEY}&i=${id}&plot=full`
        );

        const data = await response.json();

        if (data.Response === "True") {
          setMovie(data);
        } else {
          setError(data.Error || "Movie not found.");
        }
      } catch (error) {
        setError(
          "Something went wrong while loading the movie."
        );
      }

      setLoading(false);
    };

    getMovieDetails();
  }, [id]);

  if (loading) {
    return <p className="message">Loading movie...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <section className="details-page">
      <Link className="back-button" to="/">
        ← Back to Movies
      </Link>

      <div className="details-card">
        <div className="details-poster">
          <MoviePoster
            poster={movie.Poster}
            title={movie.Title}
          />
        </div>

        <div className="details-info">
          <h2>{movie.Title}</h2>

          <p className="details-subtitle">
            {movie.Year} • {movie.Runtime} • {movie.Rated}
          </p>

          <p>
            <strong>IMDb Rating:</strong> ⭐{" "}
            {movie.imdbRating}
          </p>

          <p>
            <strong>Genre:</strong> {movie.Genre}
          </p>

          <p>
            <strong>Director:</strong> {movie.Director}
          </p>

          <p>
            <strong>Actors:</strong> {movie.Actors}
          </p>

          <p>
            <strong>Language:</strong> {movie.Language}
          </p>

          <p>
            <strong>Plot:</strong> {movie.Plot}
          </p>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link className="logo" to="/">
            Movie Finder
          </Link>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/#movies">Movies</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/movie/:id"
              element={<MovieDetails />}
            />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-signature">
            <img
              src="/images/js-logo.svg"
              alt="Jordan Slisz signature"
            />
          </div>

          <p>
            copyright 2026 Jordan Slisz ~ All rights
            reserved.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;