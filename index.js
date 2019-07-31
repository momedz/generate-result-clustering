const mongoose = require('mongoose');
const MONGO_URL = '35.198.208.247';
const MONGO_PORT = '27017';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

const options = {
  useCreateIndex: true,
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

const mongo_path = `mongodb://${MONGO_URL}:${MONGO_PORT}/queue`;
mongoose.connect(mongo_path, options);
const db = mongoose.connection;

const write_table = data => {
    console.log(`# ${data.algorithm} - ${data.dataset.name}`)
    console.log('### parameter')
    console.log(`| ${Object.keys(data.parameter).toString().replaceAll(',', ' | ')} |`)
    console.log(`| ${Object.values(data.parameter).map(a => ':-:').toString().replaceAll(',', ' | ')} |`)
    console.log(`| ${Object.values(data.parameter).toString().replaceAll(',', ' | ')} |`)
    console.log('### investigate')
    console.log(`| ${Object.keys(data.investigate).toString().replaceAll(',', ' | ')} |`)
    console.log(`| ${Object.values(data.investigate).map(a => ':-:').toString().replaceAll(',', ' | ')} |`)
    console.log(`| ${Object.values(data.investigate).toString().replaceAll(',', ' | ')} |`)
    console.log('')
}

const good = (err, results) => {
    const investigate = {
        Purity: 0,
        RI: 0,
        ARI: 0,
        JI: 0,
        NMI: 0,
        FM: 0
    }
    const result = results
        .reduce((a, b) => a.investigate.Purity > b.investigate.Purity ? a: b, { investigate });
        // .reduce((a, b) => a.investigate.RI > b.investigate.RI ? a: b, { investigate });
        // .reduce((a, b) => a.investigate.ARI > b.investigate.ARI ? a: b, { investigate });
        // .reduce((a, b) => a.investigate.JI > b.investigate.JI ? a: b, { investigate });
        // .reduce((a, b) => a.investigate.NMI > b.investigate.NMI ? a: b, { investigate });
        // .reduce((a, b) => a.investigate.FM > b.investigate.FM ? a: b, { investigate });
    // console.log(result);
    write_table(result)
}

db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', async () => {
    const collection = db.collection('result');
    const algorithms = [ 'denstream', 'heces', 'hscmstream' ];
    const datasets = [ 'HCM_5k', 'AHCM_20k_noise_2d' ];
    await Promise.all(algorithms.map(async algorithm => 
        await Promise.all(datasets.map(dataset =>
            collection.find({ algorithm, 'dataset.name': dataset }).toArray(good)
        ))
    ))
    const stream = collection.watch();
    stream.on('change', change => {
        console.log(change.operationType)
    })
})
