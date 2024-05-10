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
        let mut client = D_CLIENT.lock().unwrap();
        client.connect().unwrap();
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![discord_status])
        .setup(|app| {
            let window = app.get_window("main").unwrap();

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
#[cfg(target_os = "macos")]
fn discord_status(name: String) {
    {
        let mut client = D_CLIENT.lock().unwrap();
        if name == "" {
            client.clear_activity().unwrap_or(());
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
                .unwrap_or(());
        }
    }
}

#[tauri::command]
#[cfg(not(target_os = "macos"))]
fn discord_status(name: String) {}

#[cfg(target_os = "macos")]
fn is_process_running(process_name: &str) -> bool {
    let output = Command::new("ps")
        .arg("aux")
        .output()
        .expect("Failed to execute command");

    let output_str = String::from_utf8_lossy(&output.stdout);

    // ps 명령어 결과에서 프로세스 이름이 있는지 확인
    output_str.contains(process_name)
}

#[cfg(not(target_os = "macos"))]
fn is_process_running(process_name: &str) -> bool {
    return true;
}
