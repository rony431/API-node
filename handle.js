
const express = require('express')
let config = require('./config');
let jwt = require('jsonwebtoken');

module.exports= class HandlerGenerator {
    login (req, res) {
      let username = req.body.username;
      let password = req.body.password;
      // For the given username fetch user from DB
      let mockedUsername = 'admin';
      let mockedPassword = 'password';
      if (username && password) {
        if (username === mockedUsername && password === mockedPassword) {
          let token = jwt.sign({username: username},
            config.secret,
            { expiresIn: '10h' // expires in 10 hours
            }
          );
          // return the JWT token for the future API calls
          res.json({
            success: true,
            message: 'Authentication successful!',
            token: token
          });
        } else {
          res.json({
            success: false,
            message: 'Incorrect username or password'
          });
        }
      } else {
        res.json({
          success: false,
          message: 'Authentication failed! Please check the request'
        });
      }
    }
  }