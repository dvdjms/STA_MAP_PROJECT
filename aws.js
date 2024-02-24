

const https = require('https');

exports.handler = async (event) => {
    let startAt = 0; // Initialize startAt value
    let allData = []; // Array to store all fetched data

    // Function to make a request with a given startAt value
    const fetchData = (startAt) => {
        const options = {
            hostname: 'sta2020.atlassian.net',
            path: `/rest/api/3/search?jql=project=10002&startAt=${startAt}&maxResults=1000&fields=summary,customfield_10099,customfield_10148,customfield_10214,timespent`,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.MICHAEL_EMAIL}:${process.env.STA_API_KEY}`).toString('base64'),
                'Accept': 'application/json',
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data)); // Resolve with parsed JSON data
                    } else {
                        reject(new Error(`Failed to fetch data. Status code: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.end();
        });
    };

    try {
        // Fetch data in a loop until all items are fetched
        while (true) {
            const response = await fetchData(startAt);
            if (response.issues.length === 0) break; // Break the loop if no more items to fetch
            allData = allData.concat(response.issues); // Concatenate fetched items to allData array
            startAt += response.issues.length; // Increment startAt value
        }

        // Return all fetched data
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS, GET',
            },
            body: JSON.stringify(allData), // Return allData as a JSON string
        };
    } catch (error) {
        // Return error response if any error occurs during fetching
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};







const https = require('https');

exports.handler = async (event) => {
    const options = {
        hostname: 'sta2020.atlassian.net',
        path: '/rest/api/3/search?jql=project=10002&startAt=600&maxResults=1000&fields=summary,customfield_10099,customfield_10148,customfield_10214,timespent',
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.MICHAEL_EMAIL}:${process.env.STA_API_KEY}`).toString('base64'),
            'Accept': 'application/json',
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Credentials': true,
                            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                            'Access-Control-Allow-Methods': 'OPTIONS, GET',
                        },
                        body: data,
                    });
                } else {
                    reject(new Error(`Failed to fetch data. Status code: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.end();
    });
};
