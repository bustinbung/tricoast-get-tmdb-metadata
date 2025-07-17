/* Imports */
import util from 'util';
import { readSourceData, writeOutput } from '@lib/handleFileSystem';
import * as tmdb from '@lib/queryTMDB';
import * as logger from '@lib/logger';
import { parse } from 'date-fns';
import { TricoastMetadata } from './types';

/* Options */
const castMax = 8;

let sourceFilePath = '';
// Read CLI arguments, ignoring first 2 (`node` and path to file)
const argv = process.argv.slice(2);
for (let arg of argv) {
    if (arg.indexOf('--file') !== -1) {
        const fileArg = arg.split('=')[1]
        if (fileArg === undefined) {
            throw new Error('source data file path is undefined!');
        }
        sourceFilePath = fileArg;
    }
}
if (sourceFilePath === '') {
    throw new Error('source data file path is undefined!');
}

/* Main entrypoint */
logger.say('intializing...');
const sourceData = await readSourceData(sourceFilePath);

/* Main loop */
for (let entry of sourceData) {
    logger.say('---------------------------');
    const tmdbIdMatch = entry.link.match(/\d+/);
    if (tmdbIdMatch === null) {
        logger.warn('no TMDB id found in link!');
        writeOutput('\n');
        continue;
    }
    const tmdbId = Number(tmdbIdMatch[0]);
    logger.say(`found TMDB id ${tmdbId}!`)

    const details = await tmdb.getDetails(tmdbId);
    const credits = await tmdb.getCredits(tmdbId);
    const releaseDates = await tmdb.getReleaseDates(tmdbId);

    const resultEntry: TricoastMetadata = {
        poster: '',
        title: '',
        release_year: -1,
        rating: '',
        runtime: -1,
        genres: [],
        languages: [],
        directors: [],
        cast: [],
        synopsis: '',
        imdb_id: '',
        tmdb_id: `https://themoviedb.org/movie/${tmdbId}`
    };

    // TODO: See if there's a way to avoid all these undefined checks?
    if (details !== undefined) {
        if (details.poster_path !== undefined && details.poster_path !== null) {
            const posterUrl = `https://image.tmdb.org/t/p/original${details.poster_path}`;
            const poster = `=IMAGE("${posterUrl}")`;
            resultEntry.poster = poster;
            logger.debug(`found poster path ${poster}`)
        } else {
            logger.warn(`no poster found!`);
        }
        if (details.title !== undefined) {
            const title = details.title
            resultEntry.title = title;
            logger.debug(`found title ${title}`)
        } else {
            logger.warn(`no title found!`);
        }
        if (details.release_date !== undefined && details.release_date !== '') {
            const releaseYear = parse(details.release_date, "yyyy-MM-dd", new Date()).getFullYear();
            resultEntry.release_year = releaseYear;
            logger.debug(`found release year ${releaseYear}`)
        } else {
            logger.warn(`no release year found!`);
        }
        if (details.runtime !== undefined) {
            const runtime = details.runtime;
            resultEntry.runtime = runtime;
            logger.debug(`found runtime ${runtime}`)
        } else {
            logger.warn(`no runtime found!`);
        }
        if (details.genres !== undefined) {
            const genres: string[] = [];
            details.genres.forEach((genre) => {
                if (genre.name !== undefined) {
                    genres.push(genre.name);
                }
            })
            resultEntry.genres = genres;
            logger.debug(`found genres ${genres.toString()}`)
        } else {
            logger.warn(`no genres found!`);
        }
        if (details.spoken_languages !== undefined) {
            const languages: string[] = []
            details.spoken_languages.forEach((language) => {
                if (language.english_name !== undefined) {
                    languages.push(language.english_name);
                }
            })
            resultEntry.languages = languages;
            logger.debug(`found languages ${languages.toString()}`)
        } else {
            logger.warn(`no languages found!`);
        }
        if (details.overview !== undefined) {
            const synopsisDirty = details.overview;
            const synopsis = synopsisDirty.replace(/\r?\n|\r/g, "")
            resultEntry.synopsis = util.stripVTControlCharacters(synopsis);
            logger.debug(`found synopsis ${synopsis.substring(0, 40)}`)
        } else {
            logger.warn(`no synopsis found!`);
        }
        if (details.imdb_id !== undefined && details.imdb_id !== null) {
            const imdb_id = `https://www.imdb.com/title/${details.imdb_id}/`;
            resultEntry.imdb_id = imdb_id;
            logger.debug(`found IMDB id ${imdb_id}`)
        } else {
            logger.warn(`no IMDB id found!`);
        }
    }

    if (credits !== undefined) {
        if (credits.cast !== undefined && credits.cast.length > 0) {
            const cast: string[] = [];
            for (let i = 0; i < castMax - 1; i++) {
                const castMember = credits.cast[i];
                if (castMember === undefined) {
                    break;
                }
                if (castMember.name === undefined) {
                    continue;
                }
                cast.push(castMember.name);
            }
            resultEntry.cast = cast;
            logger.debug(`found cast ${cast.toString()}`)
        } else {
            logger.warn(`no cast found!`);
        }
        if (credits.crew !== undefined && credits.crew.length > 0) {
            const directorEntries = credits.crew.filter(member => {
                return member.job === "Director";
            })
            const directors: string[] = [];
            for (let director of directorEntries) {
                if (director.name === undefined) {
                    continue;
                }
                directors.push(director.name);
            }
            resultEntry.directors = directors;
            logger.debug(`found directors ${directors.toString()}`)
        } else {
            logger.warn(`no directors found!`);
        }
    }

    if (releaseDates !== undefined && releaseDates.results !== undefined && releaseDates.results.length > 0) {
        for (let region of releaseDates.results) {
            if (region.iso_3166_1 !== "US") {
                continue;
            }
            if (region.release_dates === undefined) {
                continue;
            }

            const sortedReleaseDates = region.release_dates.sort((a, b) => {
                if (b.release_date === undefined) {
                    return 1;
                } else if (a.release_date === undefined) {
                    return -1;
                }
                return new Date(a.release_date).getTime() - new Date (b.release_date).getTime();
            })

            if (sortedReleaseDates[0] === undefined || sortedReleaseDates[0].certification === undefined) {
                logger.warn('no release date found!');
                continue;
            }
            const rating = sortedReleaseDates[0].certification;
            resultEntry.rating = rating;
            logger.debug(`found rating ${rating}`);
        }
    }

    let outputString = '';
    for (const [ key, value ] of Object.entries(resultEntry)) {
        outputString += `${value}\t`
    }
    outputString += '\n';
    writeOutput(outputString);
}

logger.say('finished!');
