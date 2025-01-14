import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'scratch-vm';
import { injectIntl, intlShape } from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    closeTelemetryModal,
    openExtensionLibrary
} from '../reducers/modals';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import QueryParserHOC from '../lib/query-parser-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/cloud-manager-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';
import { setIsScratchDesktop } from '../lib/isScratchDesktop.js';
import VMScratchBlocks from '../lib/blocks';


import { makeShowPrompt, makeHidePrompt } from '../reducers/popup'

class GUI extends React.Component {

    constructor(props) {
        super(props)
        Blockly = VMScratchBlocks(props.vm);
    }


    componentDidMount() {
        document.body.style.overflowY = "hidden"
        document.body.style.overflowX = "hidden"
        setIsScratchDesktop(this.props.isScratchDesktop);
        // this.props.onStorageInit(storage);
        this.props.onVmInit(this.props.vm);

        // 修改工具箱悬浮习性, 鼠标在上面的时候将工具箱的方块显示在最上层
        var injectDiv = document.getElementsByClassName("injectionDiv")[0];
        var blocklyFlyout = document.getElementsByClassName("blocklyFlyout")[0];
        //var blocklyBlockMenuClipRect = document.getElementById("blocklyBlockMenuClipRect");

        var zIndex_prev = blocklyFlyout.style.zIndex
        var mouseIsIn = false;
        blocklyFlyout.addEventListener("mouseover", function () {
            if (!mouseIsIn) {
                //console.log("over")
                injectDiv.style.overflow = "hidden";
                blocklyFlyout.style.overflow = "visible";
                blocklyFlyout.style.zIndex = "9999"
            }
            mouseIsIn = true;

            //blocklyBlockMenuClipRect.width = "500px";
        })
        blocklyFlyout.addEventListener("mouseout", function () {
            if (mouseIsIn) {
                //console.log("out")
                injectDiv.style.overflow = "visible";
                blocklyFlyout.style.overflow = "hidden";
                blocklyFlyout.style.zIndex = zIndex_prev;
            }
            mouseIsIn = false;
            //blocklyBlockMenuClipRect.width = "248px";
        })

        // 检测软件更新
        setInterval(() => {
            var currentVersion = '';
            var networkVersion = '';
            fetch('http://127.0.0.1:12888/version').then((res) => {
                var version = res.text()
                return version
            }).then((version) => {
                //console.log("当前版本：" + version)
                currentVersion = version
                networkVersion = currentVersion
                // 获取网络版本
                fetch('https://udrobot-update.oss-cn-hangzhou.aliyuncs.com/version_control/version_sw.json').then(res => {
                    var data = res.json()
                    return data
                }).then(data => {
                    networkVersion = data.version;
                    //console.log("网络版本: " + networkVersion)
                    if (currentVersion == networkVersion) {
                        //console.log('版本不需要更新')
                        this.props.makeHidePrompt(true)
                    } else if (data.beta){  // 显示BETA更新提示图标
                        //console.log('版本需要更新')
                        this.props.makeShowPrompt(true)
                    }
                })
            })
        }, 2000)


    }
    componentDidUpdate(prevProps) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            this.props.onUpdateProjectId(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            this.props.onProjectLoaded();
        }
        //console.log(this.props.editor)
        Blockly.svgResize(Blockly.getMainWorkspace())
    }
    render() {
        if (this.props.isError) {
            throw new Error(
                `Error in Scratch GUI [location=${window.location}]: ${this.props.error}`);
        }
        const {
            /* eslint-disable no-unused-vars */
            assetHost,
            cloudHost,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            projectHost,
            projectId,
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            setEditorMode,
            editor,
            showPrompt,
            onShowPrompt,
            onHidePrompt,
            ...componentProps
        } = this.props;



        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                {...componentProps}
                showPrompt={showPrompt}
                onShowPrompt={this.props.makeShowPrompt}
                onHidePrompt={this.props.makeHidePrompt}
            >

                {children}
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    cloudHost: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isLoading: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onProjectLoaded: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    telemetryModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    editor: PropTypes.any
};

GUI.defaultProps = {
    isScratchDesktop: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => { },
    onUpdateProjectId: () => { },
    onVmInit: (/* vm */) => { },

};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        cardsVisible: state.scratchGui.cards.visible,
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
        error: state.scratchGui.projectState.error,
        isError: getIsError(loadingState),
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        projectId: state.scratchGui.projectState.projectId,
        soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        tipsLibraryVisible: state.scratchGui.modals.tipsLibrary,
        vm: state.scratchGui.vm,
        editor: state.editorRef.o,
        showPrompt: state.showPrompt.showPrompt
    };
};

const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal()),
    makeShowPrompt: () => dispatch(makeShowPrompt()),
    makeHidePrompt: () => dispatch(makeHidePrompt()),
});

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps,
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    FontLoaderHOC,
    QueryParserHOC,
    ProjectFetcherHOC,
    TitledHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    SBFileUploaderHOC,
    cloudManagerHOC
)(ConnectedGUI);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;
