//
//  Created by Maxim Gotlib on 2/28/17.
//  Copyright © 2017 Maxim Gotlib. All rights reserved.
//

const assert = require('assert');
const util = require('util');
const debuglog = util.debuglog('CC');

class Cookie {
    constructor() {
    }
    
    get name() {
    }
    
    get value() {
    }
    
    get expire() {
    }
    
    get domain() {
    }
    
    get path() {
    }
    
    static parse(rawCookie) {
        if(rawCookie === undefined || typeof(rawCookie) !== 'string') {
            throw new TypeError('Argument rawCookie must be a string');
        }

        let cookies = [];
        
        let pairs = rawCookie.split(/;/);
        
        if(pairs.length > 1) {
            // Join adjustent pairs, having odd number of quote symbols.
            let newPairs = [];
            let quoteCount = 0;
            pairs.forEach((p) => {
                if((quoteCount & 1) == 0 || newPairs.length == 0) {
                    newPairs.push(p);
                } else {
                    let p0 = newPairs.pop();
                    newPairs.push(p0+';'+p);
                }
                quoteCount += Cookie._countQuotes(p);
            });
            pairs = newPairs;
        }
        
        let cookie = {};
        for(let i in pairs) {
            let pair = pairs[i];
            let eq_idx = pair.indexOf('=');
            
            // skip things that don't look like key=value
            if(eq_idx < 0) {
                continue;
            }
            
            let key = pair.substr(0, eq_idx).trim()
            var val = pair.substr(++eq_idx, pair.length).trim();
            var restVal;
            
            console.log('key="'+key+'"  val="'+val+'"');
            
            // Is the value quoted?
            if('"' == val[0]) {
                let close_quote_idx = val.indexOf('"', 1);
                if(close_quote_idx == val.length - 1) {
                    // The whole value was quoted.
                    val = val.slice(1, close_quote_idx);
                    if(cookie[key] === undefined) {
                        cookie[key] = Cookie._tryDecode(val);
                    }
                    continue;
                }
                if(close_quote_idx > 1) {
                    // Define the rest (unquoted part) of the value for further analysis.
                    restVal = val.substr(close_quote_idx);
                    val = val.slice(1, close_quote_idx);
                    if(cookie[key] === undefined) {
                        cookie[key] = Cookie._tryDecode(val);
                    }
                    key = undefined;
                } else {
                    // No closing quote. Let's treat openin quote as the first value character.
                    if(cookie[key] === undefined) {
                        cookie[key] = Cookie._tryDecode(val);
                    }
                    continue;
                }
            } else {
                restVal = val;
            }
            
            let intraCookies = undefined;
            while(restVal !== undefined) {
                // Locate and extra '=' in the value.
                eq_idx = restVal.indexOf('=');
                if(eq_idx < 0) {
                    restVal = undefined;
                    break;
                }
                
                // Locate ',' to the left of the '=' and start new cookie filling.
                let coma_idx = restVal.indexOf(',');
                if(coma_idx < 0) {
                    restVal = undefined;
                    break;
                }
                if(coma_idx < eq_idx) {
                    val = val.substr(0, coma_idx);
                    intraCookies = Cookie.parse(restVal.substr(coma_idx+1).trim());
                    break;
                }
                
                break;
            }
            
            if(key !== undefined && cookie[key] === undefined) {
                cookie[key] = Cookie._tryDecode(val);
            }

            if(intraCookies !== undefined) {
                cookies.push(cookie);
                if(intraCookies.length > 0) {
                    for(var ic = 0; ic < intraCookies.length-1; ++ic) {
                        cookies.push(intraCookies[ic]);
                    }
                    cookie = intraCookies[intraCookies.length-1];
                } else {
                    cookie = {};
                }
            }
        }
        
        if(cookie !== undefined) {
            cookies.push(cookie);
        }
        
        return cookies;
    }
    
    static _tryDecode(val) {
        if(val === undefined || typeof(val) !== 'string') {
            throw new TypeError('Argument val must be a string');
        }
        return val;
    }
    
    static _countQuotes(val) {
        if(val === undefined || typeof(val) !== 'string') {
            throw new TypeError('Argument val must be a string');
        }
        let count = 0;
        let idx = 0;
        do {
            idx = val.indexOf('"', idx);
            if(idx > 0) {
                idx++;
                count++;
            }
        } while(idx > 0);
        return count;
    }
}

let moduleExports = module.exports = {};
moduleExports.Cookie = Cookie;

console.log('**********************************');
let cookies = Cookie.parse('key0=val0;key1="val1;k=v,kk=vv",k0=v0;k1=v1,kk0="123, 456";kk1=vv1');
//let cookies = Cookie.parse('key0');
console.log(cookies);
console.log('**********************************');
