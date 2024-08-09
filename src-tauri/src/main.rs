// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use discord_rich_presence::{
    activity::{self, Assets, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use std::{
    process::Command,
    sync::Mutex,
    thread,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use window_vibrancy::*;

use lazy_static::lazy_static;
lazy_static! {
    static ref D_CLIENT: Mutex<DiscordIpcClient> =
        Mutex::new(DiscordIpcClient::new("1238146103908630639").unwrap());
}

fn main() {
    {
        thread::spawn(|| {
            let mut client = D_CLIENT.lock().unwrap();
            client.connect().unwrap_or(());
        });
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![discord_status, custom_css])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "windows")]
            {
                window.open_devtools();
                window.close_devtools();
            }
            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
// #[cfg(not(target_os = "windows"))]
fn discord_status(name: String) {
    thread::spawn(move || {
        if !is_process_running("Discord") {
            return;
        }

        {
            let client = D_CLIENT.lock();
            if client.is_err() {
                return;
            }
            let mut client = client.unwrap();
            if name == "" {
                client.clear_activity().unwrap_or_else(|_| {
                    client.connect().unwrap_or(());
                    client.clear_activity().unwrap_or(())
                });
            } else {
                let start = SystemTime::now();
                let since_the_epoch = start
                    .duration_since(UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_secs();
                client
                    .set_activity(
                        activity::Activity::new()
                            .timestamps(Timestamps::new().start(since_the_epoch as i64))
                            .assets(Assets::new().large_image("hedgehog"))
                            .details(&format!("Listening to {name:?}")),
                    )
                    .unwrap_or_else(|_| {
                        client.connect().unwrap_or(());
                        client
                            .set_activity(
                                activity::Activity::new()
                                    .timestamps(Timestamps::new().start(since_the_epoch as i64))
                                    .assets(Assets::new().large_image("hedgehog"))
                                    .details(&format!("Listening to {name:?}")),
                            )
                            .unwrap_or(())
                    });
            }
        }
    });
}

#[tauri::command]
#[cfg(not(target_os = "windows"))]
fn custom_css() -> String {
    #[allow(deprecated)]
    let home = std::env::home_dir().unwrap().to_str().unwrap().to_owned();

    std::fs::read_to_string(format!("{home}/.config/ny-music/theme.css")).unwrap_or_else(|_| {
        std::fs::create_dir(format!("{home}/.config")).unwrap_or_else(|_| {});
        std::fs::create_dir(format!("{home}/.config/ny-music")).unwrap_or_else(|_| {});

        std::fs::write(
            format!("{home}/.config/ny-music/theme.css"),
            ":root {\n\t--gray: #313244;\n\t--black: #1e1e2e;\n\t--primary: #a6e3a1;\n}",
        )
        .unwrap_or_else(|_| {});
        return ":root {\n\t--gray: #313244;\n\t--black: #1e1e2e;\n\t--primary: #a6e3a1;\n}"
            .to_string();
    })
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn custom_css() -> String {
    #[allow(deprecated)]
    let home = std::env::home_dir().unwrap().to_str().unwrap().to_owned();

    std::fs::read_to_string(format!("{home}/.config/ny-music/theme.css")).unwrap_or_else(|_| {
        std::fs::create_dir(format!("{home}/.config")).unwrap_or_else(|_| {});
        std::fs::create_dir(format!("{home}/.config/ny-music")).unwrap_or_else(|_| {});

        std::fs::write(
            format!("{home}/.config/ny-music/theme.css"),
            ":root {\n\t--gray: #313244;\n\t--black: #1e1e2e;\n\t--primary: #a6e3a1;\n}\nhtml,body {\n\tbackground: #11111b;\n}",
        )
        .unwrap_or_else(|_| {});
        return ":root {\n\t--gray: #313244;\n\t--black: #1e1e2e;\n\t--primary: #a6e3a1;\n}\nhtml,body {\n\tbackground: #11111b;\n}"
            .to_string();
    })
}

#[cfg(not(target_os = "windows"))]
fn is_process_running(process_name: &str) -> bool {
    let output = Command::new("ps")
        .arg("aux")
        .output()
        .expect("Failed to execute command");

    let output_str = String::from_utf8_lossy(&output.stdout);

    // ps 명령어 결과에서 프로세스 이름이 있는지 확인
    output_str.contains(process_name)
}

#[cfg(target_os = "windows")]
fn is_process_running(process_name: &str) -> bool {
    false
}
