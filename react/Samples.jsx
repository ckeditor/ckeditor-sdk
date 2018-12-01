import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, NavLink, Route, Switch, withRouter } from 'react-router-dom';

import Nav from './Nav.jsx';
import EditorTypes from './EditorTypes.jsx';
import ConfigEvents from './ConfigEvents.jsx';
import TwoWayBinding from './TwoWayBinding.jsx';

class Samples extends Component {
	render() {
		return (
			<HashRouter>
				<SamplesContainer>
					<Nav label="React integration samples">
						<NavLink exact={true} to="/" activeClassName="active">Editor Types</NavLink>
						<NavLink to="/events" activeClassName="active">Config &amp; Events</NavLink>
						<NavLink to="/2-way-binding" activeClassName="active">2-way Binding</NavLink>
					</Nav>
					<Switch>
						<Route exact path="/" component={EditorTypes} />
						<Route path="/events" component={ConfigEvents} />
						<Route path="/2-way-binding" component={TwoWayBinding} />
					</Switch>
				</SamplesContainer>
			</HashRouter>
		);
	}
}

const SamplesContainer = withRouter( class extends Component {
	componentDidUpdate() {
		refreshSamples();
	}

	render() {
		return (
			<>
				{this.props.children}
			</>
		);
	}
} );

function refreshSamples() {
	if ( simpleSample ) {
		simpleSample.refreshSamples();
	}
}

ReactDOM.render(
	<Samples />,
	window.document.getElementById( 'app' )
);

