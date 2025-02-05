import React, { useEffect, useState, useContext } from 'react';
import { GlobalContext } from 'context/globalContext';
import { BtnSimple } from 'getbasecore/Atoms';
import Wrapper from 'components/molecules/Wrapper/Wrapper';
import EmuModal from 'components/molecules/EmuModal/EmuModal';
import Header from 'components/organisms/Header/Header';
import Footer from 'components/organisms/Footer/Footer';
import { useParams } from 'react-router-dom';
import CloudSyncConfig from 'components/organisms/Wrappers/CloudSyncConfig';

function CloudSyncPageConfig() {
  const { state, setState } = useContext(GlobalContext);
  const json = JSON.stringify(state);
  const { cloudSync, cloudSyncType, system, mode } = state;
  const { type } = useParams();
  const [statePage, setStatePage] = useState({
    disabledNext: false,
    disabledBack: false,
    disableButton: false,
    showLoginButton: false,
    modal: undefined,
  });
  const { disabledNext, disabledBack, disableButton, showLoginButton, modal } =
    statePage;

  const ipcChannel = window.electron.ipcRenderer;

  const cloudSyncSet = (item) => {
    let modalData = undefined;
    if (item === 'Emudeck-GDrive') {
      modalData = {
        active: true,
        header: <span className="h4">Warning</span>,
        body: (
          <p>
            If you are using a free Google Drive account we don't recomended to
            use it with CloudSync since Google will throttle your connection,
            making CloudSync really really slow.
          </p>
        ),
        css: 'emumodal--sm',
      };
    }

    setState({
      ...state,
      cloudSync: item,
    });
    setStatePage({
      ...statePage,
      showLoginButton: false,
      modal: modalData,
    });
  };

  const closeModal = () => {
    const modalData = { active: false };
    setStatePage({
      ...statePage,
      modal: modalData,
    });
  };

  const uploadAll = () => {
    ipcChannel.sendMessage('emudeck', [`uploadAll|||cloud_sync_uploadEmuAll`]);

    ipcChannel.once('uploadAll', (message) => {
      console.log({ message });
      const modalData = {
        active: true,
        header: <span className="h4">Upload Complete</span>,
        body: (
          <p>
            All your saved games and states have been uploaded to your cloud
            provider.
          </p>
        ),
        css: 'emumodal--xs',
      };
      setStatePage({ ...statePage, modal: modalData });
    });
  };

  const downloadAll = () => {
    ipcChannel.sendMessage('emudeck', [
      `downloadAll|||cloud_sync_downloadEmuAll`,
    ]);

    ipcChannel.once('downloadAll', (message) => {
      console.log({ message });
      const modalData = {
        active: true,
        header: <span className="h4">Download Complete</span>,
        body: (
          <p>
            All your saved games and states have been downloaded from your cloud
            provider.
          </p>
        ),
        css: 'emumodal--xs',
      };
      setStatePage({ ...statePage, modal: modalData });
    });
  };

  const installRclone = () => {
    // OLD TOKEN upload, not needed for now
    // if (
    //   confirm(
    //     'Press OK if you already have CloudSync installed on another EmuDeck installation and you want to sync that installation to this one, if not, press Cancel'
    //   ) === true
    // ) {
    //   ipcChannel.sendMessage('emudeck', [
    //     `cloud_sync_install_and_config_with_code|||cloud_sync_install_and_config_with_code ${cloudSync}`,
    //   ]);
    //   ipcChannel.once('cloud_sync_install_and_config_with_code', (message) => {
    //     // No versioning found, what to do?
    //     console.log('cloudSync', message);
    //     alert(
    //       `All Done, every time you load a game your Game states and Saved games will be synced to ${cloudSync}`
    //     );
    //   });
    // } else {

    setStatePage({
      ...statePage,
      disableButton: true,
    });
    let cloudFunction;
    if (cloudSyncType === 'Sync') {
      cloudFunction = 'cloud_sync_install_and_config';
    } else {
      cloudFunction = 'cloud_backup_install_and_config';
    }
    console.log(`${cloudFunction} ${cloudSync}`);

    ipcChannel.sendMessage('emudeck', [
      `cloud_saves|||${cloudFunction} ${cloudSync}`,
    ]);

    ipcChannel.once('cloud_saves', (message) => {
      const { stdout } = message;

      if (stdout.includes('true')) {
        const modalData = {
          active: true,
          header: <span className="h4">CloudSync Configured</span>,
          body: (
            <>
              <p>
                Now every time you load a game your game states and saved games
                will be synced to the cloud. Keep in mind that every time you
                play on a device that last save will be the one on the cloud
              </p>
              <p>Do you want to upload or download all your saved games now?</p>
            </>
          ),
          css: 'emumodal--sm',
          footer: (
            <>
              <BtnSimple
                css="btn-simple--1"
                type="button"
                aria="Download all saves from your Cloud Provider"
                onClick={() => downloadAll()}
              >
                Download all saves
              </BtnSimple>
              <BtnSimple
                css="btn-simple--1"
                type="button"
                aria="Upload all your saves to your Cloud Provider"
                onClick={() => uploadAll()}
              >
                Upload all saves
              </BtnSimple>
              <BtnSimple
                css="btn-simple--1"
                type="button"
                aria="Close"
                onClick={() => closeModal()}
              >
                Close
              </BtnSimple>
            </>
          ),
        };
        setState({
          ...state,
          cloudSyncStatus: true,
        });
        setStatePage({ ...statePage, disableButton: false, modal: modalData });
      }
    });
    // }
  };

  const uninstallRclone = () => {
    setStatePage({
      ...statePage,
      disableButton: true,
    });
    ipcChannel.sendMessage('emudeck', [
      `cloud_sync_uninstall|||cloud_sync_uninstall`,
    ]);
    ipcChannel.once('cloud_sync_uninstall', (message) => {
      // No versioning found, what to do?

      const modalData = {
        active: true,
        header: <span className="h4">Cloud Sync uninstalled</span>,
        css: 'emumodal--xs',
      };
      setStatePage({
        ...state,
        cloudSync: null,
        disableButton: false,
        modal: modalData,
      });
      setState({
        ...state,
        cloudSyncStatus: false,
      });
    });
  };

  const createDesktopIcon = () => {
    setStatePage({
      ...statePage,
      disableButton: true,
    });

    if (system === 'win32') {
      ipcChannel.sendMessage('emudeck', [
        `rclone_install|||rclone_install ${cloudSync}`,
      ]);
      ipcChannel.once('rclone_install', (message) => {
        // No versioning found, what to do?
        const modalData = {
          active: true,
          header: <span className="h4">CloudSave Configured</span>,
          body: (
            <p>
              All Done, every time you load a Game your Game states and Saved
              games will be synced to ${cloudSync} in the background every 5
              minutes
            </p>
          ),
          css: 'emumodal--sm',
        };
        setStatePage({
          ...statePage,
          disableButton: false,
          modal: modalData,
        });
      });
    } else {
      ipcChannel.sendMessage('emudeck', [
        `createDesktop|||createDesktopShortcut "$HOME/Desktop/SaveBackup.desktop" "EmuDeck SaveBackup" ". $HOME/.config/EmuDeck/backend/functions/all.sh && rclone_setup" true`,
      ]);

      ipcChannel.once('createDesktop', (message) => {
        // No versioning found, what to do?
        setStatePage({
          ...statePage,
          disableButton: false,
        });
      });

      ipcChannel.sendMessage('bash-nolog', [
        `zenity --info --width=400 --text="Go to your Desktop and open the new EmuDeck SaveBackup icon.`,
      ]);
    }
  };

  useEffect(() => {
    ipcChannel.sendMessage('emudeck', [
      `save-setting|||setSetting rclone_provider ${cloudSync}`,
    ]);
    localStorage.setItem('settings_emudeck', json);
  }, [cloudSync]);

  const nextButtonStatus = () => {
    if (type === 'welcome') {
      return false;
    }
    return 'copy-games';
  };

  return (
    <Wrapper>
      <Header title="Cloud Saves - Select your provider" />
      <CloudSyncConfig
        onClick={cloudSyncSet}
        onClickInstall={installRclone}
        onClickUninstall={uninstallRclone}
        disableButton={disableButton}
        showLoginButton={showLoginButton}
      />

      <Footer
        next={nextButtonStatus()}
        nextText="Copy games"
        disabledNext={disabledNext}
        disabledBack={disabledBack}
      />
      <EmuModal modal={modal} />
    </Wrapper>
  );
}

export default CloudSyncPageConfig;
