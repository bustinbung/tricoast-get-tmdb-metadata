import { Fetcher, Middleware } from "openapi-typescript-fetch";
import { paths } from "@api/tmdb.d";
import * as logger from '@lib/logger';
import 'dotenv/config';

const api_key = process.env.API_KEY;
const fetcher = Fetcher.for<paths>();
const logMiddleware: Middleware = async (url, init, next) => {
    logger.debug(`fetching ${url}`);
    const response = await next(url, init);
    logger.debug(`fetched ${url}`);
    return response;
}
fetcher.configure({
    baseUrl: "https://api.themoviedb.org",
    init: {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${api_key}`
        }
    },
    use: [logMiddleware]
})

const fetchGetCredits = fetcher.path('/3/movie/{movie_id}/credits').method('get').create();
const fetchGetDetails = fetcher.path('/3/movie/{movie_id}').method('get').create();
const fetchGetReleaseDates = fetcher.path('/3/movie/{movie_id}/release_dates').method('get').create();

export async function getCredits(tmdbId: number) {
    let data;
    try {
        const { status, data: credits } = await fetchGetCredits({
            movie_id: tmdbId,
        });
        data = credits;
    } catch (e) {
        logger.error(e);
    }

    return data;
}

export async function getDetails(tmdbId: number) {
    let data;
    try {
        const { status, data: details } = await fetchGetDetails({
            movie_id: tmdbId,
        });
        data = details;
    } catch (e) {
        logger.error(e);
    }

    return data;
}

export async function getReleaseDates(tmdbId: number) {
    let data;
    try {
        const { status, data: releaseDates } = await fetchGetReleaseDates({
            movie_id: tmdbId,
        });
        data = releaseDates;
    } catch (e) {
        logger.error(e);
    }

    return data;
}
