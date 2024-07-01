const https = require('https');

exports.handler = async (event) => {
	const baseUrl = 'https://sta2020.atlassian.net/rest/api/3/search';
	const queryParams = {
		jql: 'project=10002 AND cf[10214] IS NOT NULL',
		fields: 'summary,customfield_10099,customfield_10148,customfield_10214,customfield_10197,customfield_10150,customfield_10205,timespent'
	};

	let allData = [];

	try {
		let startAt = 0;
		let hasNextPage = true;
				
		while (hasNextPage) {
			const options = {
                hostname: 'sta2020.atlassian.net',
                path: `${baseUrl}?${new URLSearchParams({ ...queryParams, startAt })}`,
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${process.env.MICHAEL_EMAIL}:${process.env.STA_API_KEY}`).toString('base64'),
                    'Accept': 'application/json',
                }
            };

            const response = await fetchData(options);
            allData = allData.concat(response.issues);

            // Check if there are more pages to fetch
            if (response.startAt + response.maxResults < response.total) {
                    startAt += response.maxResults;
            } else {
                    hasNextPage = false;
            };
		};

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'OPTIONS, GET',
            },
            body: JSON.stringify({ issues: allData }), // Return all batches as one batch
        };
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		};
	};
};

async function fetchData(options) {
	return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
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

