// First we import several nodejs modules (libraries)
// that provide required functionality

// http module allows to create HTTP server and process requests from a browser
var http = require('http');

// fs module provides an access to file system
var fs = require('fs');

// url module gives handy functions to parse URL and retrieve from there
// such parsts as query parameters
var url = require('url');

http.createServer(function (req, res) {

    if (req.method == 'GET') {
        handleGetChatText(req, res);
    } else if (req.method == 'POST') {
        handlePostChatMessage(req, res);
    }

}).listen(8080);

/**
 * This function handles GET request to the server
 * and retrieves the chat history.
 */
function handleGetChatText(requst, response) {

    // We try to read contents from the file
    // that stores complete chat history
    fs.readFile('chat_text.txt', function(err, data) {

        // If there no messages had been posted,
        // then chat log file doesn't exist.
        var chatText = (err && err.code == 'ENOENT')
                ? "The chat is empty"
                : renderAsHtmk(data);

        writeHtml(response, chatText);
    });
}

function handlePostChatMessage(request, response) {

    // Here's a tricky moment for newbies.
    // Request payload can be splitted into several packes if it's too big.
    // That's why from the performance point of view, is's not optimal
    // to wait for the entire request to be read.
    // Nodejs will receive request payload parts one by one and call
    // 'data' callback function to pass each part to it.
    // When all parts are received, it will call 'end' callback.

    // This is a list where we'll collect request payload parts
    var body = [];


    request.on('error', function(err) {
        console.error(err);
        writeHtml(response, "Failed to add message");
    }).on('data', function (chunk) {
        // adding next payload part
        body.push(chunk);
    }).on('end', function () {

        // Combining all received payload parts into a single string.
        body = Buffer.concat(body).toString();

        // Constructing chat message text
        var message = getMessageAuthor(request) + ": " + body + "\n\n";

        fs.appendFile('chat_text.txt', message, function (err) {
            if (err) {
                console.log(err);
                writeHtml(response, "Failed to add message");
            } else {
                writeHtml(response, "Successfilly added message");
            }
        }); 
    });
}

/**
 * Returnes message author on 'anonymous' if author is not cpecified.
 */
function getMessageAuthor(request) {
    var queryParams = url.parse(request.url, true).query;
    return (queryParams.user)
        ? queryParams.user
        : "anonymous";
}

/**
 * Renders text as preformatted block on HTML page.
 */
function renderAsHtmk(text) {
    return "<html><title>Herkochat-1.0</title><body><pre>"
         + text
         + "</pre></body></html>";
}

/**
 * Writes text as response payload
 */
function writeHtml(response, html) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();
}
