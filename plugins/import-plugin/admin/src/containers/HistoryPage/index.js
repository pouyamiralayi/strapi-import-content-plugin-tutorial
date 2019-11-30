import React, {Component} from 'react'
import {HeaderNav, LoadingIndicator, PluginHeader} from "strapi-helper-plugin";
import pluginId from "../../pluginId";
import Row from "../../components/Row";
import Container from "../../components/Container";
import Block from '../../components/Block'
import HistoryTable from "../../components/HistoryTable";
import axios from "axios";
import {api_url} from "../../constants";

const getUrl = to => to ? `/plugins/${pluginId}/${to}` : `/plugins/${pluginId}`;
const getNavTrad = trad => `${pluginId}.${trad}.numbered`;

class HistoryPage extends Component {
  state = {
    loading: false,
    importConfigs: []
  };

  deleteImport = async (id) => {
    const res = await axios.delete(api_url + 'import-plugin/' + id)
    if (res && res.data) {
      let {importConfigs} = this.state
      importConfigs = importConfigs.splice(importConfigs.findIndex(imp => imp.id === res.data), 1)
      this.setState({importConfigs}, () => {
        strapi.notification.success(
          `Deleted`
        );
      })
    }
  }

  undoImport = async (id) => {
    const res = await axios.post(api_url + `import-plugin/${id}/undo`)
    strapi.notification.info(
      `Undo Started`
    );
  }

  getConfigs = async () => {
    try {
      const res = await axios.get(api_url + 'import-plugin/')
      // console.log(res)
      // this.setState({loading: false})
      if (res && res.data) {
        return res.data
      } else {
        throw Error("No Data Available.")
      }
    } catch (e) {
      console.log('GET error: ', e)
    }
    return []
  }

  importConfigs() {
    if (!this.state.loading) {
      this.getConfigs().then(res => {
        // console.log(res)
        this.setState({importConfigs: res})
      })
    }
  }

  componentDidMount() {
    this.setState({loading: true})
    this.getConfigs().then(res => {
      this.setState({importConfigs: res, loading: false})
    })
    setTimeout(() => {
      this.fetchInterval = setInterval(() => this.importConfigs(), 4000)
    }, 2000)
  }

  componentWillUnmount() {
    if(this.fetchInterval){
      clearInterval(this.fetchInterval)
    }
  }

  render() {
    const {importConfigs} = this.state
    // console.log(importConfigs)
    return (
      <Container className={"container-fluid"}>
        <PluginHeader
          title={"Import Plugin"}
          description={"Import CSV and RSS-Feed into your Content Types"}
        />
        <Row>
          <HeaderNav
            links={[
              {
                name: "Import Data",
                to: getUrl(''),
                // values: { number: models.length },
              },
              {
                name: "Import History",
                to: getUrl('history'),
                // values: { number: models.length },
              },
            ]}
            style={{marginTop: '4.4rem'}}
          />
        </Row>
        <div className="row">
          <Block
            title="General"
            description="Manage the Initiated Imports"
            style={{marginBottom: 12}}
          >
            {this.state.loading && (
              <LoadingIndicator/>
            )}
            {!this.state.loading && importConfigs && (
              <Row className={'row'}>
                <HistoryTable
                  undoImport={this.undoImport}
                  deleteImport={this.deleteImport}
                  configs={this.state.importConfigs}
                />
              </Row>
            )}
          </Block>
        </div>
      </Container>
    )
  }
}

export default HistoryPage