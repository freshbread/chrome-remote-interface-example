const googleTrends = require('google-trends-api');
// googleTrends.interestOverTime({keyword: ['바이든', '트럼프'], startTime: new Date('2023-05-07')})
//     .then(function(results){
//         console.log(results);
//     })
//     .catch(function(err){
//         console.error('Oh no there was an error', err);
//     });

googleTrends.relatedQueries({keyword: '트럼프', startTime: new Date('2023-05-07')})
    .then((res) => {
        console.log(res);
    })
    .catch((err) => {
        console.log(err);
    });