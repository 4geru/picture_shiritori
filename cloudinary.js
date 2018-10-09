var cloudinary = require('cloudinary');


cloudinary.config({ 
    cloud_name: 'dzhcf23xd',
    api_key: '873287313676422',
    api_secret: 'odnTOp_OqmGma8FTCpASqiZ4QDM'
})

cloudinary.v2.uploader.upload("xxx.png", 
    function(error, result) {console.log(result, error)});;
