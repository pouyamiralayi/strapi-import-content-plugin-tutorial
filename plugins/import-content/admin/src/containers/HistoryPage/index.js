/*
 *
 * HistoryPage
 *
 */

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

class HistoryPage extends Component {
  state = {
    loading: false,
    importConfigs: []
  };

  deleteImport = async (id) => {
    this.setState({loading: true}, async () => {
      try {
        const res = await axios.delete(api_url + 'import-content/' + id)
        if (res && res.data) {
          let {importConfigs} = this.state
          importConfigs = importConfigs.filter(imp => imp.id != id)
          this.setState({importConfigs, loading: false}, () => {
            strapi.notification.success(
              `Deleted`
            );
          })
        } else {
          this.setState({loading: false}, () => {
            strapi.notification.error(
              `Delete Failed`
            );
          })
        }
      } catch (e) {
        this.setState({loading: false}, () => {
          strapi.notification.error(
            `${e}`
          );
        })
      }
    })
  }

  undoImport = async (id) => {
    this.setState({loading: true}, async () => {
      await axios.post(api_url + `import-content/${id}/undo`)
      this.setState({loading: false}, () => {
        strapi.notification.info(
          `Undo Started`
        );
      })
    })
  }

  getConfigs = async () => {
    try {
      const res = await axios.get(api_url + 'import-content/')
      if (res && res.data) {
        return res.data
      } else {
        throw Error("No Data Available.")
      }
    } catch (e) {
      strapi.notification.error(`${e}`)
      return []
    }
  }

  importConfigs() {
    if (!this.state.loading) {
      this.getConfigs().then(res => {
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
    }, 200)
  }

  componentWillUnmount() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval)
    }
  }

  render() {
    const {importConfigs} = this.state
    return (
      <Container className={"container-fluid"}>
        <PluginHeader
          title={"Import Content"}
          description={"Import CSV and RSS-Feed into your Content Types"}
        />
        <Row>
          <HeaderNav
            links={[
              {
                name: "Import Data",
                to: getUrl(''),
              },
              {
                name: "Import History",
                to: getUrl('history'),
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
