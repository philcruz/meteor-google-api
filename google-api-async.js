// kill logs
var Log = function (message) {console.log(message);}

GoogleApi = {
  // host component, shouldn't change
  _host: 'https://www.googleapis.com',
    
  _callAndRefresh: function(method, path, options, callback) {
    var self = this;
    options = options || {};
        
    self._call(method, path, options,       
      // need to bind the env here so we can do mongo writes in the callback 
      // (when refreshing), if we call this on the server
      Meteor.bindEnvironment(function(error, result) {
        if (error && error.response && error.response.statusCode == 401) {
          Log('google-api attempting token refresh');

          return self._refresh(options.user || options.refreshTokenParams, function(error, result) {
            if (error)
              return callback(error);
            
            console.log("in the _refresh callback:" + result);
            // if we have the user, we'll need to re-fetch them, as their
            // access token will have changed.
            if (options.user)
              options.user = Meteor.users.findOne(options.user._id);
            else
                options.params.access_token = result;
              
            
            self._call(method, path, options, callback);
          });
        } else {
          callback(error, result);
        }
    }, 'Google Api callAndRefresh'));
  },
  
  // call a GAPI Meteor.http function if the accessToken is good
  _call: function(method, path, options, callback) {
    Log('GoogleApi._call, path:' + path);
    
    options = options || {};
    var user = options.user || Meteor.user();
    
    if (user && user.services && user.services.google && 
        user.services.google.accessToken) {
      options.headers = options.headers || {};
      options.headers.Authorization = 'Bearer ' + user.services.google.accessToken;
    
      HTTP.call(method, this._host + '/' + path, options, function(error, result) {
        callback(error, result && result.data);
      });
    } else if (options.params.access_token) {
      console.log("options.params.access_token" + options.params.access_token);
      options.headers = options.headers || {};
      options.headers.Authorization = 'Bearer ' + options.params.access_token;
      delete options.params.access_token;

      HTTP.call(method, this._host + '/' + path, options, function(error, result) {
        callback(error, result && result.data);
      });
        
    } else {
      callback(new Meteor.Error(403, "Auth token not found." +
        "Connect your google account"));
    }
  },

  _refresh: function(refreshObject, callback) {
    Log('GoogleApi._refresh');
    Log(refreshObject);

    Meteor.call('exchangeRefreshToken', refreshObject, function(error, result) {
      callback(error, result && result.access_token)
    });
  }
}

// setup HTTP verbs
httpVerbs = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
_.each(httpVerbs, function(verb) {
  GoogleApi[verb.toLowerCase()] = wrapAsync(function(path, options, callback) {
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    }

    return this._callAndRefresh(verb, path, options, callback);
  })
});
