/* Global type declarations */
import { operations } from "@api/tmdb";

export type CreditsCrew = operations["movie-credits"]['responses']['200']['content']["application/json"]['crew'];
export type CreditsCast = operations["movie-credits"]['responses']['200']['content']["application/json"]['cast'];

export type SourceData = {
    link: string,
}

export type TricoastMetadata = {
    poster: string,
    title: string,
    release_year: number,
    rating: string,
    runtime: number,
    genres: string[],
    languages: string[],
    directors: string[],
    cast: string[],
    synopsis: string,
    imdb_id: string,
    tmdb_id: string
}
