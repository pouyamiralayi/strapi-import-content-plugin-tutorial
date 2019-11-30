import React, {Component} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Row from '../TableRow'
import {Table, Button} from '@buffetjs/core'
// import { Remove, Component as ComponentIcon } from '@buffetjs/icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faUndo
} from '@fortawesome/free-solid-svg-icons';

import {api_url} from "../../constants";
import axios from 'axios'
import moment from "moment";
import {LoadingIndicator, PopUpWarning} from "strapi-helper-plugin";

class HistoryTable extends Component {


  state = {
    showDeleteModal: false,
    showUndoModal: false,
    importToDelete: null,
    importToUndo: null,
  }


  deleteImport = id => {
    console.log(id)
    this.setState({showDeleteModal: true, importToDelete: id})
    // this.props.deleteImport(id);
  };

  undoImport = id => {
    console.log(id)
    this.setState({showUndoModal: true, importToUndo: id})
    // this.props.undoImport(id);
  };

  getSourceText = item => {
    switch (item.source) {
      case 'upload':
        return item.options.filename;
      case 'url':
        return item.options.url;
    }
  };

  CustomRow = ({row}) => {
    const {id, contentType, importedCount, ongoing, updated_at} = row
    const updatedAt = moment(updated_at)
    const styles = {
      name: {
        textTransform: 'capitalize',
      },
    };

    return (
      <Row>
        <td>{this.getSourceText(row)}</td>
        <td>{contentType}</td>
        <td>{updatedAt.format('LLL')}</td>
        <td>{importedCount}</td>
        <td>
          {ongoing ? (
            <LoadingIndicator/>
          ) : (
            <span>Ready</span>
          )}
        </td>
        <td>
          <div className={'row'}>
            <div
              style={{
                marginRight: 18,
                marginLeft: 18,
              }}
              onClick={() => this.undoImport(id)}
            >
              <i className={'fa fa-undo'} role={'button'}/>
            </div>
            <div
              onClick={() => this.deleteImport(id)}
            >
              <i className={'fa fa-trash'} role={'button'}></i>
            </div>
          </div>
        </td>
      </Row>
    );
  };


  render() {
    const {configs} = this.props;
    // console.log(configs)
    const props = {
      title: 'Import History',
      subtitle: "Manage the Initiated Imports",

    }
    // console.log('targetModel: ', targetModel)
    const headers = [
      {name: 'Source', value: 'source'},
      {name: 'Content Type', value: 'contentType'},
      {name: 'Updated At', value: 'updatedAt'},
      {name: 'Items', value: 'items'},
      {name: 'Progress State', value: 'progress'},
      {name: 'Actions', value: 'actions'},
      // {name: 'Remove', value: 'remove'},
    ]
    const items = [
      ...configs
    ]

    const {importToDelete, importToUndo, showDeleteModal, showUndoModal} = this.state
    return (
      <div className={'col-md-12'} style={{paddingTop:12}}>
        <PopUpWarning
          isOpen={showDeleteModal}
          toggleModal={(prevState) => this.setState({showDeleteModal:null})}
          content={{
            title: `Please confirm`,
            message: `Are you sure you want to delete this entry?`,
            // cancel: `cancel`,
            // confirm: `got it`,
          }}
          popUpWarningType="danger"
          onConfirm={() =>
          {
            importToDelete && this.props.deleteImport(importToDelete)
            this.setState({importToDelete:null, showDeleteModal:false})
          }}
        />
        <PopUpWarning
          isOpen={showUndoModal}
          toggleModal={(prevState) => this.setState({showUndoModal:null})}
          content={{
            title: `Please confirm`,
            message: `Are you sure you want to undo this entry?`,
            // cancel: `cancel`,
            // confirm: `got it`,
          }}
          popUpWarningType="danger"
          onConfirm={() =>
          {
            importToUndo && this.props.undoImport(importToUndo)
            this.setState({importToUndo:null, showUndoModal:false})
          }}
        />
        <Table
          {...props}
          headers={headers}
          rows={items}
          customRow={this.CustomRow}
        />
      </div>
    );
  }

}

HistoryTable.propTypes = {
  // targetModel: PropTypes.object,
  configs: PropTypes.array.isRequired,
  deleteImport: PropTypes.func,
  undoImport: PropTypes.func
};

export default HistoryTable;
