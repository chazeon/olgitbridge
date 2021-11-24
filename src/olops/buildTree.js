/*
| Rebuilds a rootFolder returned by joinProject into a filename based tree
*/
const buildTree =
	function( folder, branch )
{
	branch.type = 'folder';
	branch.id = folder._id;
	branch.name = folder.name;
	const subs = branch.subs = { };
	for( let e of folder.docs )
	{
		const name = e.name;
		const doc = subs[ name ] = { };
		doc.type = 'doc';
		doc.id = e._id;
		doc.name = name;
		doc.branch = branch;
	}
	for( let e of folder.fileRefs )
	{
		const name = e.name;
		const doc = subs[ name ] = { };
		doc.type = 'file';
		doc.id = e._id;
		doc.name = name;
		doc.branch = branch;
	}
	for( let e of folder.folders )
	{
		const subBranch = subs[ e.name ] = { };
		buildTree( e, subBranch );
		subBranch.branch = branch;
	}
};

module.exports =
	function( rootFolder )
{
	const tree = { };
	buildTree( rootFolder, tree );
	return tree;
};
