/*
| Operations executed on overleaf (CE/Pro) server.
*/
module.exports =
{
	addFolder: require( './addFolder' ),
	buildTree: require( './buildTree' ),
	client: require( './client' ),
	downloadZip: require( './downloadZip' ),
	getProjectPage: require( './getProjectPage' ),
	remove: require( './remove' ),
	joinProject: require( './joinProject' ),
	login: require( './login' ),
	logout: require( './logout' ),
	upload: require( './upload' ),
};
