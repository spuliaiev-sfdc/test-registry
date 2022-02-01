import { fileMetadataSync } from 'file-metadata';
// const
//     fileMetadata = require('file-metadata');

function run() {
    console.log(fileMetadataSync('/Users/spuliaiev/blt/app/main/core/${metric.dir}/rehydration-20210601-191323720.log'));
}
run()