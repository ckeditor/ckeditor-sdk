/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

var path = require( 'path' );

function Path( name, base ) {
    this.parts = path.resolve( name ).split( path.sep );

    if ( typeof base === 'string' ) {
        this.base = new Path( base );
    } else if ( base instanceof Path ) {
        // clone rather than keep reference, because of memory leaks
        this.base = base;
    } else {
        this.base = null;
    }
}

Path.prototype = {
    matchLeft: function ( arr ) {
        var i = 0,
            partsNumber = this.parts.length;

        if ( arr instanceof Path ) {
            arr = Array.prototype.slice.call( arr.parts );
        }

        var last = arr.shift();

        while( typeof last === 'string' ) {

            // Provided path is longer that checked one.
            if ( i >= partsNumber ) {
                return false;
            }

            // Don't want to check '*'
            if ( last === '*' ) {
                i++;
                last = arr.shift();
                continue;
            }

            // Check file with any name and specific extenstion
            // *.php ==> something.php
            var regExp = /^\*\.(\w+)$/,
                result = regExp.exec( last );

            if ( result ) {
                var extension = result[ 1 ],
                    compareResult = /^\S*\.(\w+)$/.exec( this.parts[ i ] );
                if ( compareResult && compareResult[ 1 ] == extension ) {
                    // Assume that we are checking last element.
                    return true;
                }
            }

            // Doesn't match
            if ( this.parts[ i ] !== last ) {
                return false;
            }

            i++;
            last = arr.shift();
        }

        return true;
    }
};

module.exports = Path;
