# tricoast-get-tmdb-metadata

Finds and returns requested metadata for a given TMDB listing.

## Installation

Install packages using npm.

``` sh
npm install
```

Then run however you like to execute TypeScript.

``` sh
tsx src/index.ts --env-file=.env --file=<PATH_TO_CSV_FILE> [--debug]
```

## Usage

The script expects an `.env` file with an `API_KEY`. Change `.env.tmpl` to provide your own key, and rename the file to `.env`.

The script also expects a CSV file. Provide the file path with the `--file` flag. Relative and absolute paths are supported, but you may need to mess around with dot notation to get it to find the correct location. The CSV file should contain a column titled "TMDB" and should include a valid TMDB link.

This script does not support searching TV series.

## Details

The program executes as follows:
1. Read the source data file into memory.
2. Search TMDB for the relevant metadata.
3. Export results to a file to be copied into a spreadsheet.

The program will output the results to `out/`.

## Troubleshooting

You can get a debug log by passing the `--debug` flag when running the program.

Open an issue on GitHub if you have issues.
