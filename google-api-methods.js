Meteor.methods({
  // Obtain a new access token using the refresh token
  exchangeRefreshToken: function(refreshObject) {
    this.unblock();
    
    var params;
    console.log("in exchangeRefreshToken...");
    console.log(refreshObject);
    if ( ! refreshObject.hasOwnProperty('refresh_token') ) {
        //passed in the userID
        console.log("passed in the userID...");
        var userId = refreshObject;
        var user;
        if (userId && Meteor.isServer) {
            user = Meteor.users.findOne({_id: userId});
        } else {
            user = Meteor.user();
        }

        var config = Accounts.loginServiceConfiguration.findOne({service: "google"});
        if (! config)
            throw new Meteor.Error(500, "Google service not configured.");

        if (! user.services || ! user.services.google || ! user.services.google.refreshToken)
            throw new Meteor.Error(500, "Refresh token not found.");
        
        params = {
            'client_id': config.clientId,
            'client_secret': config.secret,
            'refresh_token': user.services.google.refreshToken,
            'grant_type': 'refresh_token'
          };
        
    } else {
        //passed in a refreshObject
        console.log("passed in the refresh options...");
        params = {
            'client_id': refreshObject.client_id,
            'client_secret': refreshObject.client_secret,
            'refresh_token': refreshObject.refresh_token,
            'grant_type': 'refresh_token'
          };        
    }
      
    
    
    try {
      var result = Meteor.http.call("POST",
        "https://accounts.google.com/o/oauth2/token",
        {
          params: params
      });
    } catch (e) {
      var code = e.response ? e.response.statusCode : 500;
      throw new Meteor.Error(code, 'Unable to exchange google refresh token.', e.response)
    }
    
    if (result.statusCode === 200) {
      // console.log('success');
      // console.log(EJSON.stringify(result.data));
        
    if (user) {
      Meteor.users.update(user._id, { 
        '$set': { 
          'services.google.accessToken': result.data.access_token,
          'services.google.expiresAt': (+new Date) + (1000 * result.data.expires_in),
        }
      });
    }
    
    if (refreshObject.updateTokenFunction) {
        console.log("updating the access_token: " + result.data.access_token)
        refreshObject.updateTokenFunction(result.data.access_token);
    }

      return result.data;
    } else {
      throw new Meteor.Error(result.statusCode, 'Unable to exchange google refresh token.', result);
    }
  }
});