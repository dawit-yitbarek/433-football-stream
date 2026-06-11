import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { type matchData } from "@/context/MatchesContext";
import { Alert } from 'react-native';

export const toggleGameNotification = async (
    match: matchData,
    isToggledOn: boolean,
    setScheduledMatchIds: React.Dispatch<React.SetStateAction<string[]>>
) => {
    const notificationId = `match-notif-${match.id}`;

    if (isToggledOn) {
        // Schedule Notification

        const triggerSeconds = match.match_time - Math.floor(Date.now() / 1000);

        if (triggerSeconds <= 0) {
            Alert.alert("", "Game already started.");
            return;
        }

        const hasPermission = await verifyAndRequestNotificationPermissions();
        if (!hasPermission) {
            return;
        }
        setScheduledMatchIds(prev => [...prev, match.id]);
        await Notifications.scheduleNotificationAsync({
            identifier: notificationId,
            content: {
                title: `⚽ Match Starting: ${match.home_team_name} vs ${match.away_team_name}`,
                body: `The whistle is blowing! Tap to jump straight into the live feed.`,
                sound: 'default',
                categoryIdentifier: 'match-kickoff',
                ...({ channelId: 'default' } as any),
                data: {
                    matchId: match.id,
                    urlPath: `/match/${match.id}`,
                    notificationId: notificationId,
                },
            },
            trigger: {
                date: new Date(match.match_time * 1000),
                type: SchedulableTriggerInputTypes.DATE
            },
        });


    } else {
        // Cancel Notification
        setScheduledMatchIds(prev => prev.filter(id => id !== match.id));
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
};


async function verifyAndRequestNotificationPermissions(): Promise<boolean> {
    // Check the current permission state on the device
    const settings = await Notifications.getPermissionsAsync();

    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return true;
    }


    // If the user previously denied it permanently, canAskAgain might be false
    if (settings.canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });
        return status === 'granted';
    }

    // If they permanently denied it, guide them to their system settings
    Alert.alert(
        "Permissions Required",
        "Notifications are disabled for this app. Please enable them in your phone's system settings to receive match reminders.",
        [{ text: "OK" }]
    );
    return false;
}