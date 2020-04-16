const express = require('express')
require('dotenv').config()
const fetch = require('node-fetch')
const apicache = require('apicache');
const bodyParser = require('body-parser');
let HandlerGenerator = require('./handle');
let middleware = require('./middleware');

const APIKEYW = process.env.APIKEYW
const APIKEYGEO = process.env.APIKEYGEO

  function main () {
    let app = express(); // Export app for other routes to use
    let cache = apicache.middleware 
    let handlers = new HandlerGenerator();
    const port = process.env.PORT || 8000;
    app.use(bodyParser.urlencoded({ // Middleware
      extended: true
    }));
    app.use(bodyParser.json());

    // Post to Login to verify Token with the credentials
    app.post('/login', handlers.login);
    // ask to authenticate in all the routes
    app.get('*', middleware.checkToken);


    // Endpoint to verify the address if it's valid or not
    app.get('/geo-verify/:street.:streetNumber.:town.:postal.:country',middleware.checkToken,cache('12 hours'), async function  (req, res) {
        var addressStreet = req.params.street 
        var addressNumber = req.params.streetNumber 
        var addressTown = req.params.town
        var addressPostalCode = req.params.postal
        var addressCountry = req.params.country
        const data = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressStreet}+${addressNumber}+${addressTown}+${addressPostalCode}+${addressCountry}&key=${APIKEYGEO}`)
        .then(res => res.ok)
        .catch(err => console.error(err))
        if (data){
            res.json({
                success: true,
                message: 'Valid address'
              });

        }else{
            res.json({
                success: false,
                message: 'NOT Valid address'
              });
        }
    })
    // Check the weather with the lat and lng provided

    app.get('/weather-check/:lat/long/:lng',middleware.checkToken,cache('12 hours'),async function  (req, res) {
        var latitude = req.params.lat 
        var longitude = req.params.lng 
        const data = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${APIKEYW}&units=metric`)
        .then(res => res.json())
        .catch(err => err.statusCode=404)
        res.send(data.main)
    })


    // check weather according to the address
    app.get('/geo-weather/:street.:streetNumber.:town.:postal.:country',middleware.checkToken,cache('12 hours'),async function  (req, res) {

        var addressStreet = req.params.street 
        var addressNumber = req.params.streetNumber 
        var addressTown = req.params.town
        var addressPostalCode = req.params.postal
        var addressCountry = req.params.country
        const data = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressStreet}+${addressNumber}+${addressTown}+${addressPostalCode}+${addressCountry}&key=${APIKEYGEO}`)
        .then(res => res.json())
        .catch(err => console.error(err))
        if(data.status == 'OK'){
            let geoLat =  data.results[0].geometry.location.lat
            let geoLng =  data.results[0].geometry.location.lng
            const dataWeather = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${geoLat}&lon=${geoLng}&appid=${APIKEYW}&units=metric`)
            .then(res => res.json())
            .catch(err => res.send(err))
            if(dataWeather.cod == 200){
                res.send(dataWeather.main)
            }else{
                let err = new Error('Data retrieve from weather is not working');
                err.statusCode = 404;
                next(err);
            }
        }else{
            res.json({
                success: false,
                message: data.status
              });
        }
    
    })

    app.listen(port, () => console.log(`Server is listening on port: ${port}`));
  }
  
  main();

