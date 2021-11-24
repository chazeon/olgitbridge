/*
| Creates a promised semaphore.
|
| Requests get a flag which has to be used on release (to catch misscalls).
*/
class Semaphore
{
	constructor( )
	{
		this._flag = undefined;
		this._fifo = [ ];
	}

	/*
	| Requests the semaphore (call with await)
	| async blocks if taken.
	*/
	request( )
	{
		return(
			new Promise( ( resolve, reject ) => {
				// is the semaphore taken?
				if( this._flag ) this._fifo.push( resolve );
				else resolve( this._flag = Object.freeze( { } ) );
			} )
		);
	}

	/*
	| Releases the semaphore (do not call with await)
	*/
	release( flag )
	{
		const fifo = this._fifo;
		if( flag !== this._flag ) throw new Error( );
		this._flag = undefined;
		// the semaphore comes free?
		if( fifo.length === 0 ) return;
		const resolve = fifo.shift( );
		resolve( this._flag = Object.freeze( { } ) );
	}
}

module.exports = Semaphore;

