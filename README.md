Google API
----------

A Meteor library to interact with Google's API.

Works with accounts-google to automatically handle refresh/access token changes and give you a simple API to make calls.

# Install

```
meteor add percolate:google-api
```

# Usage

To call the library, use the `get()` and `post()` functions:

```
GoogleApi.get('/your/api/path', options, callback);
```

If `callback` is provided (client or server), the call will be made **asynchronously**. 

On the client, if you do not provide a callback, the library will return a [Q promise](https://github.com/kriskowal/q). On the server, it will run **synchronously**.

If the user's access token has expired, it will transparently call the `exchangeRefreshToken` method to get a new refresh token.

If you don't want to make the call on behalf of the logged in user, i.e. you want to manage the OAuth tokens manually you can pass in options.refreshTokenParams 
object, for example:

```
//assuming a Tokens collection that stores the access tokens
//define a function to update the access token
updateAccessToken = function(access_token) {    
    Tokens.upsert(
                {account: Meteor.settings.account},
                    { $set:
                        {                        
                            accessToken: access_token                            
                        }
                    }                
            );
}

options = {  
        refreshTokenParams: {
            'client_id': Meteor.settings.public.client_id,
            'client_secret': Meteor.settings.client_secret,
            'refresh_token': tokens.refreshToken,
            'updateTokenFunction': updateAccessToken
        },
        params: { 'access_token': tokens.accessToken  }
        }

    result = GoogleApi.get( apiUrl, options);
```

# Contributions

Are welcome.

*MIT license, (c) Percolate Studio, maintained by Tom Coleman (@tmeasday).*
