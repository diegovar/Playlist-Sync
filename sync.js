var fs = require('fs'),
	util = require('util'),
	_path = require('path');

var playlistPath = process.argv.length > 2 ? process.argv[2] : 'Sync.m3u',
	sourceFolder = process.argv.length > 3 ? process.argv[3] : '/Volumes/AIR SD CARD/Music/Music/',
	destinationFolder = process.argv.length > 4 ? process.argv[4] : '/Volumes/ANDROID/MUSIC/';

console.log('-- Playlist copy application --\n');
console.log('Copying from ' + sourceFolder + ' to ' + destinationFolder + '\n');

var playlist = fs.readFileSync(playlistPath, 'UTF-8');
var sourceSongs = playlist
		.split('\r')
		.slice(1)
		.filter(function(name, i) { 
			return i % 2 == 1; 
		})
		.map(function(path) {
			return path.replace(sourceFolder, '');
		});
console.log('Found ' + sourceSongs.length + ' in the source folder.');

var recurseFolder = function(path, levels) {
	
	var levels = levels === undefined ? 3 : levels,
		nodes = [];
	try {
		if(!levels) return path;
		fs.readdirSync(path).forEach(function(folder) {
			var rec = recurseFolder(path + '/' + folder, levels - 1);
			nodes = nodes.concat(rec);
		});
		return nodes;
	} catch(e) {
		if(e.code == 'ENOTDIR') {
			return path;
		}
		throw e;
	}
}
if(!_path.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder);

var targetSongs = recurseFolder(destinationFolder).map(function(s) { return s.replace(destinationFolder, '')});
console.log('Found ' + targetSongs.length + ' files in the target folder.');


Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

//get the diff
var toDelete = targetSongs.diff(sourceSongs);
var toCopy = sourceSongs.diff(targetSongs);
console.log(toDelete.length + ' songs will be deleted. ' + toCopy.length + ' songs will be copied.');

console.log('Deleting ' + toDelete.length + ' songs...');
//delete the songs that need to be deleted
toDelete.forEach(function(f,i) {
	fs.unlink(destinationFolder + f);
	console.log(i+1);
});
console.log('DONE\n');

//taken from http://procbits.com/2011/11/15/synchronous-file-copy-in-node-js/
var copyFileSync = function(srcFile, destFile) {

	var folders = destFile.split('/');
	folders.pop();
	for(var i = 0; i < folders.length - 1; i++) {
		var path = folders.slice(0,i+2).join('/');
		if(!_path.existsSync(path)) {
			fs.mkdirSync(path);
		}
	}
	
	var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
  	BUF_LENGTH = 64 * 1024;
	buff = new Buffer(BUF_LENGTH);
	fdr = fs.openSync(srcFile, 'r');
	fdw = fs.openSync(destFile, 'w');
	bytesRead = 1;
	pos = 0;
	while (bytesRead > 0) {
		bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw, buff, 0, bytesRead);
		pos += bytesRead;
	}
	fs.closeSync(fdr);
	return fs.closeSync(fdw);
};

console.log('Copying ' + toCopy.length + ' songs...');
//copy the songs that need to be copied
toCopy.forEach(function(f,i) {
	copyFileSync(sourceFolder + f, destinationFolder + f);
	console.log(i+1);
});
console.log('DONE\n');