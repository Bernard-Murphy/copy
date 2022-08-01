const { exec } = require('child_process');

/**
 * This script runs just after the front end app is built
 * Generates the service worker
 * The service worker is responsible for caching the files
 * It is also necessary for the app to be served as a PWA
 * This script parses the public folder and returns an absolute file path for each file to be parsed
 * At the time of writing this the cache is about 20MB
 * TODO: Remove files from the public folder that are not used
 */

let dir = '';
let cacheFiles = [];

getMainDir = () => {
    /**
     * Sets the main directory and returns a list of files/folders in that directory
     */
    return new Promise((resolve, reject) => {
        exec('pwd', (err, stdout, stderr) => {
            if (err) return reject(err);
            if (stdout){
                dir = stdout.split('\n').join('/');
                exec('ls', (err, stdout, stderr) => {
                    if (err) return reject(err);
                    if (stdout){
                        return resolve(stdout);
                    }
                    if (stderr) return reject(stderr);
                })
            }
            if (stderr) return reject(stderr);
        })
    })
}

parseDirectory = directory => {
    /**
     * Uses recursion to populate the cacheFiles array with absolute file paths
     * Lists contents of directory
     * Loops through contents
     * If item is a file, push absolute path to that file to the cacheFiles array
     * If item is a directory, perform the same action on that directory
     * Repeat until all files have paths
     */
    return new Promise((resolve, reject) => {
        exec(`cd ${dir}${directory} && ls`, async (err, stdout, stderr) => {
            if (err) return reject(err);
            if (stdout){
                let data = stdout.split('\n');
                for (let i = 0; i < data.length; i++){
                    let point = data[i];
                    if (point !== ''){
                        if (point.split('.').length > 1) cacheFiles.push(`./${directory}/${point}`);
                        else parseDirectory(`${directory}/${point}`);
                    }
                }
                return resolve();
            }
            if (stderr) return reject(stderr);
        })
    });
}


(mainFunction = async () => {
    /**
     * Get the root directory and its contents, then parse it
     * Create a service worker that caches all of the files in that directory and subdirectory.
     * Instruct the application to serve items from the cache instead of fetching them when possible
     * Write the service worker to the local file system
     */
    let mainLocations = await getMainDir();
    for (let i = 0; i < mainLocations.split('\n').length; i++){
        let data = mainLocations.split('\n')[i];
        if (data !== '' && data.split('.').length < 2){
            await parseDirectory(data);
        }
    }
    console.log(cacheFiles);
})();