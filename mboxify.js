'use strict';

/////////////////////////////////////////////////////////////////////////////////////////////////////
// copyright (c) 2014 Polly Powledge
// licensed under the MIT licenseThe MIT License (MIT)
//
// Copyright (c) 2014 PollyP
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
/////////////////////////////////////////////////////////////////////////////////////////////////////

var mboxify = (function() {

  // convert a string representing a rfc 2822 message to mboxrd flavor string suitable for
  // writing to an mbox file.
  // reference: https://web.archive.org/web/20080706014011/http://homepages.tesco.net/~J.deBoynePollard/FGA/mail-mbox-formats.html
  // reference: http://www.qmail.org/man/man5/mbox.html
  function convertToMboxFormat( myinput ) {

	if ( myinput == undefined || myinput == "" )
	{
		return undefined;
	}

	//console.log('raw input:\n' + myinput );

	// first, look for sender info
	var re = /^From:*\s*(.*)$/m;
	// if not found use MAILER-DAEMON instead
	var sender = "MAILER-DAEMON";
	var results = re.exec(myinput);
	if ( results != null && results.length > 1 ) {
		// first item in results array is matching line. second item is sender.
		sender = results[1];
		// if sender has embedded spaces, tabs or newlines replace with '_'
		sender = sender.replace(/\s/g,'_');
	}

	// second, look for date delivery info
	re = /^Date:*(.*)$/m;
	var mydate = new Date();
	var results = re.exec(myinput);
	if ( results != null && results.length > 1 ) {
		// first item in results array is matching line. second item is sender.
		var datestr = results[1];
		mydate = new Date(datestr);
	}

	// what we want: Www Mmm dd hh:mm:ss yyyy
	var wwwmmmddb = mydate.toString().slice(0,11);
	var hhmmss = mydate.toString().slice(16,24);
	var byyyy = mydate.toString().slice(10,15);
	var btz = mydate.toString().slice(24,39);
	//var myasctime = wwwmmmddb + hhmmss + byyyy + btz;
	var myasctime = wwwmmmddb + hhmmss + byyyy;

	// third, replace all 'From ' lines with '>From '
	// includes 'From ' lines already prepended with an '>'
	myinput = myinput.replace(/^((>*From) (.*$))/mg, ">$2 $3");

	// fourth, add separator line after message
	// if last line is partial, append two NLs; otherwise append one NL
	var len = myinput.length;
	var lastchar = myinput[len-1];
	//console.log('myinput: ' + lastchar.charCodeAt(0).toString(16) );
	if ( lastchar != '\r' && lastchar != '\n' ) {
		myinput = myinput + '\r\n';
	}
	myinput = myinput + '\r\n';

	// now stick the new From_ line at the beginning of the message
	myinput = 'From ' + sender + ' ' + myasctime + '\n' + myinput;
	//console.log('rewritten:\n' + myinput );
	return myinput;
  }

  // a regression test for the module
  function regressionTest()
  {
	var ret = convertToMboxFormat();
	console.assert(ret==undefined);

	var ret = convertToMboxFormat("");
	console.assert(ret==undefined);
	
	var      myinput = '\nMIME-Version: 1.0\nReceived: by 10.76.113.108 with HTTP; Wed, 8 Oct 2014 13:07:01 -0700 (PDT)\nReply-To: foo@gmail.com\nDate: Wed, 8 Oct 2014 13:07:01 -0700\nDelivered-To: foo@gmail.com\nMessage-ID: <CAH-_BD-atH7f1tb7_2ORZ7kBp10OT0gzeEk9tPfhhtEJH1wmmg@mail.gmail.com>\nSubject: a test message\nFrom: Foo <foo@gmail.com>\nTo: Foo <foo@gmail.com>\nContent-Type: multipart/alternative; boundary=047d7b67256ce7239f0504eedbc8\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/plain; charset=UTF-8\n\nFrom sea to shining sea\n\n>From another shore\n\nEt tu from blah\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/html; charset=UTF-8\n\n<div dir="ltr">From sea to shining sea<div><br></div><div>&gt;From another shore</div><div><br></div><div>Et tu from blah</div></div>\n\n--047d7b67256ce7239f0504eedbc8--\n'
	ret = convertToMboxFormat(myinput);
	console.assert(ret!=undefined);
	var expected_ret = '\nMIME-Version: 1.0\nReceived: by 10.76.113.108 with HTTP; Wed, 8 Oct 2014 13:07:01 -0700 (PDT)\nReply-To: foo@gmail.com\nDate: Wed, 8 Oct 2014 13:07:01 -0700\nDelivered-To: foo@gmail.com\nMessage-ID: <CAH-_BD-atH7f1tb7_2ORZ7kBp10OT0gzeEk9tPfhhtEJH1wmmg@mail.gmail.com>\nSubject: a test message\nFrom: Foo <foo@gmail.com>\nTo: Foo <foo@gmail.com>\nContent-Type: multipart/alternative; boundary=047d7b67256ce7239f0504eedbc8\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/plain; charset=UTF-8\n\n>From sea to shining sea\n\n>>From another shore\n\nEt tu from blah\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/html; charset=UTF-8\n\n<div dir="ltr">From sea to shining sea<div><br></div><div>&gt;From another shore</div><div><br></div><div>Et tu from blah</div></div>\n\n--047d7b67256ce7239f0504eedbc8--\n'
	//console.log( ret == expected_ret );

	myinput = expected_ret;
	ret = convertToMboxFormat(myinput);
	console.assert(ret!=undefined);
	var expected_ret = '\nMIME-Version: 1.0\nReceived: by 10.76.113.108 with HTTP; Wed, 8 Oct 2014 13:07:01 -0700 (PDT)\nReply-To: foo@gmail.com\nDate: Wed, 8 Oct 2014 13:07:01 -0700\nDelivered-To: foo@gmail.com\nMessage-ID: <CAH-_BD-atH7f1tb7_2ORZ7kBp10OT0gzeEk9tPfhhtEJH1wmmg@mail.gmail.com>\nSubject: a test message\nFrom: Foo <foo@gmail.com>\nTo: Foo <foo@gmail.com>\nContent-Type: multipart/alternative; boundary=047d7b67256ce7239f0504eedbc8\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/plain; charset=UTF-8\n\n>>From sea to shining sea\n\n>>>>From another shore\n\nEt tu from blah\n\n--047d7b67256ce7239f0504eedbc8\nContent-Type: text/html; charset=UTF-8\n\n<div dir="ltr">From sea to shining sea<div><br></div><div>&gt;From another shore</div><div><br></div><div>Et tu from blah</div></div>\n\n--047d7b67256ce7239f0504eedbc8--\n'
	//console.log( ret == expected_ret );

  }

  return {
    convertToMboxFormat : convertToMboxFormat,
    regressionTest : regressionTest
  };

})();

