import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Plot?: string;
  imdbRating?: string;
  Genre?: string;
  Director?: string;
  Actors?: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  movies: Movie[] = [];
  searchQuery: string = '';
  loading = false;
  error: string | null = null;
  selectedMovie: any = null;

  private currentFetchId = 0;

  private apiKey = 'bca3444';

  ngOnInit() {
    this.fetchMovies('movie', 2024);
  }

  fetchMovies(query: string, year?: number, maxResults = 20) {
    const fetchId = ++this.currentFetchId;
    this.loading = true;
    this.error = null;
    this.movies = [];

    const fetchPage = (page: number) => {
      let url = `https://www.omdbapi.com/?apikey=${this.apiKey}&s=${encodeURIComponent(query)}&type=movie&page=${page}`;
      if (year) url += `&y=${year}`;
      return fetch(url).then(res => res.json());
    };

    const pages = Math.ceil(maxResults / 10);

    Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1)))
      .then(results => {
        if (fetchId !== this.currentFetchId) return;

        const allMovies: Movie[] = [];
        for (const data of results) {
          if (data.Response === 'True') {
            for (const movie of data.Search) {
              if (movie && movie.imdbID && !allMovies.some(m => m.imdbID === movie.imdbID)) {
                allMovies.push(movie);
                if (allMovies.length >= maxResults) break;
              }
            }
            if (allMovies.length >= maxResults) break;
          } else {
            switch (data.Error) {
              case 'Movie not found!':
                this.error = 'Фильмы не найдены';
                break;
              case 'Too many results.':
                this.error = 'Слишком много результатов, уточните поиск';
                break;
              default:
                this.error = 'Ошибка при загрузке данных';
            }
          }
        }

        this.movies = allMovies;
        this.loading = false;

        this.movies.forEach((movie, index) => {
          fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&i=${movie.imdbID}&plot=short`)
            .then(res => res.json())
            .then(data => {
              if (fetchId !== this.currentFetchId) return;
              this.movies[index] = { ...movie, ...data };
            });
        });

        if (this.movies.length > 0) this.error = null;
      })
      .catch(() => {
        if (fetchId !== this.currentFetchId) return;
        this.error = 'Ошибка при загрузке данных';
        this.loading = false;
      });
  }


  onInputChange() {
    const query = this.searchQuery.trim();
    this.fetchMovies(query || 'movie', 2024);
  }

  selectMovie(movie: Movie) {
    if (!movie.Plot) {
      fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&i=${movie.imdbID}&plot=full`)
        .then(res => res.json())
        .then(data => {
          this.selectedMovie = { ...movie, ...data };
        });
    } else {
      this.selectedMovie = movie;
    }
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay') ||
      (event.target as HTMLElement).classList.contains('modal-close')) {
      this.selectedMovie = null;
    }
  }
}
