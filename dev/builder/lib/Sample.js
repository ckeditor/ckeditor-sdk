/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

/* jshint node: true */

var cheerio = require( 'cheerio' ),
	_ = require( 'lodash-node' ),
	TITLE_PREFIX = 'CKEditor SDK » Samples » ';

function Sample( name, content, indexObj, zipFilename, opts ) {
	var that = this;
	this.$ = cheerio.load( content, {
		decodeEntities: false
	} );

	this.name = name;

	this.$title = this.$( 'title' );
	this.title = this.$title.html();
	this.$title.text( TITLE_PREFIX + this.title );

	this.$head = this.$( 'head' );
	this.$header = this.$( 'header' );
	this.$footer = this.$( 'footer' );

	// Pick all data-append elements and store them in array.
	if ( this.name == 'index' ) {
		this.appendElements = [];

		this.$( '[data-append]' ).each( function() {
			var element = that.$( this ),
			elementHtml = that.$.html( element ),
			selector = this.attribs[ 'data-append' ];

			that.appendElements.push( {
				selector: selector,
				html: elementHtml
			} );
		} );
	}

	if ( indexObj ) {
		this.$header.html( indexObj.$header.html() );
		this.$footer.html( indexObj.$footer.html() );

		// Appending all data-append elements in proper position.
		_.each( indexObj.appendElements, function( element ) {
			that.$( element.selector ).append( element.html );
		} );
	} else {
		if ( opts.version === 'online' ) {
			this.$( '.sdk-main-navigation ul' ).append( '<li><a href="/' + zipFilename + '">Download SDK</a></li>' );
		}
	}

	// Don't need data-append attributes because they are useless now.
	this.$( '[data-append]' ).removeAttr( 'data-append' );

	this.$nav = this.$( 'nav.sdk-sidebar' );
}

Sample.prototype = {
	parseMeta: function( name, lengthValidator ) {
		lengthValidator = lengthValidator || function( element ) {
			return element.length != 1;
		};

		this[ name ] = this.$( 'meta[name="sdk-' + name + '"]' );

		if ( lengthValidator( this[ name ] ) ) {
			throw 'Invalid number of sdk-' + name + ' meta tags in sample: ' + this.name;
		}

		this[ name ] = this[ name ].attr( 'content' );
	},

	setSidebar: function( categories ) {
		if ( this.name != 'index' && this.name != 'license' ) {
			this.$nav.html( Sample.createSidebar( categories, _.pick( this, 'category', 'subcategory', 'name' ) ) );
		} else {
			this.$nav.html( Sample.createSidebar( categories, undefined, true ) );
		}
	},

	activateSamplesButton: function() {
		var that = this;
		this.$( '.sdk-main-navigation a' ).each( function( index, element ) {
			if ( this.attribs.href == '../index.html' ) {
				that.$( element ).addClass( 'active' );
			}
		} );
	},

	fixLinks: function( prefix ) {
		var that = this;

		if ( this.name == 'index' || this.name == 'license' ) {
			this.$( 'head link, head script, .sdk-header a, .sdk-header img, .sdk-footer a' ).each( function( index, element ) {
				// We want to manipulate only this attributes - when are not present then we are doing nothing.
				if ( !this.attribs.href && !this.attribs.src ) {
					return;
				}

				var attrName = this.attribs.href ? 'href' : 'src',
				attrVal = this.attribs[ attrName ];

				that.$( element ).attr( attrName, attrVal.replace( '../', '' ) );
			} );
		}

		this.$( '.sdk-main-navigation a, .sdk-contents a, nav.sdk-sidebar a' ).each( function( index, element ) {
			that.$( element ).attr( 'href', Sample.fixLink( this.attribs.href, prefix ) );
		} );

		this.$( '.sdk-contents form' ).each( function( index, element ) {
			that.$( element ).attr( 'action', Sample.fixFormAction( this.attribs.action ) );
		} );
	},

	fixCKEDITORVendorLinks: function( version ) {
		var that = this,
		cdnEditorLink = '//cdn.ckeditor.com/' + version + '/standard-all/';
		this.$( 'head script[src$="ckeditor.js"]' ).each( function( index, element ) {
			that.$( element ).attr( 'src', cdnEditorLink + 'ckeditor.js' );
		} );

		this.$( 'script[data-sample]' ).each( function( index, domElement ) {
			var element = that.$( domElement ),
			html = element.html(),
			resultHtml;

			resultHtml = html.replace( /(\s{1})(['|"][\s\S]*?['|"])([\s\S]*?)/g, function( match, $1, $2, $3 ) {
				if ( $2.indexOf( '../..' ) != -1 ) {
					return $1 + $2.replace( '../..', 'http://sdk.ckeditor.com' ) + $3;
				}

				if ( $2.indexOf( '../vendor/ckeditor/' ) != -1 ) {
					return $1 + $2.replace( '../vendor/ckeditor/', 'http:' + cdnEditorLink ) + $3;
				}

				return $1 + $2 + $3;
			} );

			element.text( resultHtml );
		} );
	},

	validateLinks: function( errors ) {
		var that = this;

		this.$( '.sdk-main-navigation a, .sdk-contents a, nav.sdk-sidebar a' ).each( function() {
			var result = Sample.validateLink( this.attribs.href, errors );

			if ( result instanceof Error ) {
				errors.push( {
					sample: that.name,
					link: this.attribs.href,
					message: result.message
				} );
			}
		} );
	},

	fixFonts: function() {
		var that = this,
		pathPrefix = ( that.name == 'index' || that.name == 'license' ? '' : '../' );

		this.$( 'link[href*="fonts.googleapis.com"]' ).each( function( index, element ) {
			that.$( element ).attr( 'href', pathPrefix + 'theme/css/fonts.css' );
		} );
	},

	preventSearchEngineRobots: function() {
		this.$head.append( '<meta name="robots" content="noindex, nofollow">' );
	},

	cleanOtherVersionElements: function( version ) {
		var that = this;
		version = ( version == 'offline' ? 'online' : 'offline' );

		this.$( '[data-sdk-version="' + version + '"]' ).remove();

		this.$( '[data-sdk-version]' ).each( function( index, element ) {
			that.$( element ).removeAttr( 'data-sdk-version' );
		} );
	}
};

Sample.fixLink = function( href, prefix ) {
	prefix = ( typeof prefix === 'string' ? prefix : '../' );

	if ( href.indexOf( 'http://docs.ckeditor.com/' ) !== -1 ) {
		href = href.replace( 'http://docs.ckeditor.com/', prefix + 'docs/index.html' );
	}

	return href;
};

Sample.fixFormAction = function( href ) {
	return href.replace( /\.\/(\S*)/, function( a, $1 ) {
		return 'http://sdk.ckeditor.com/samples/' + $1;
	} );
};

Sample.validateLink = function( href ) {
	if ( typeof href != 'string' ) {
		return new Error( 'Anchor does not have href attribute. ' );
	}

	if ( href.length === 0 ) {
		return new Error( 'Href attribute is empty.' );
	}

	if ( href.indexOf( 'localhost' ) !== -1 ) {
		return new Error( 'Href points to localhost.' );
	}

	if ( href.indexOf( '/docs/build/#!' ) !== -1 ) {
		return new Error( 'Invalid link "/docs/" use "http://docs.ckeditor.com" instead.' );
	}
};

// return sidebar HTML string
Sample.createSidebar = function( categories, highlight, index ) {
	var result = [],
	list = [],

	highlightMe, highlightSubcategory;

	_.each( categories, function( category ) {
		result.push( '<h2>' + category.name + '</h2>' );

		_.each( category.subcategories, function( subcategory ) {
			if ( !subcategory.samples.length ) {
				return;
			}

			highlightSubcategory = false;

			list = [ '<ul>' ];
			_.each( subcategory.samples, function( sample ) {
				highlightMe = (
				highlight &&
				sample.category == highlight.category &&
				sample.subcategory == highlight.subcategory &&
				sample.name == highlight.name
				);

				list.push( '<li class="' + ( highlightMe ? 'active' : '' ) + '"><a href="' +
					( index ? 'samples/' : '' ) + sample.name + '.html">' + sample.title + '</a></li>' );

				highlightSubcategory |= highlightMe;
			} );
			list.push( '</ul>' );

			result.push( '<h3 ' + ( highlightSubcategory ? 'class="active"' : '' ) + '>' + subcategory.name + '</h3>' );
			result = result.concat( list );
		} );
	} );

	return result.join( '' );
};

module.exports = Sample;