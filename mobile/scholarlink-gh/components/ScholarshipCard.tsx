import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { Scholarship, ScholarshipMatch } from "../types/api";
import { getCountdownLabel, formatDeadline } from "../utils/date";
import { BaseScholarshipCard } from "./BaseScholarshipCard";

type Props = {
  scholarship?: Scholarship;
  match?: ScholarshipMatch;
  onPress: () => void;
};

type StatusInfo = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

function getStatusInfo(
  status: Scholarship["status"] | undefined,
  days: number | undefined | null
): StatusInfo {
  const resolved =
    status ??
    (days != null
      ? days < 0
        ? "CLOSED"
        : days === 0
        ? "CLOSING_SOON"
        : "OPEN"
      : "OPEN");

  switch (resolved) {
    case "OPEN":
      return {
        label: "Open",
        backgroundColor: "rgba(27, 109, 36, 0.12)",
        textColor: colors.success,
      };
    case "CLOSING_SOON":
      return {
        label: "Closing Soon",
        backgroundColor: "rgba(216, 136, 92, 0.15)",
        textColor: colors.warning,
      };
    case "FULL":
      return {
        label: "Full",
        backgroundColor: "rgba(216, 136, 92, 0.15)",
        textColor: colors.warning,
      };
    case "CLOSED":
      return {
        label: "Closed",
        backgroundColor: colors.surfaceMuted,
        textColor: colors.muted,
      };
    default:
      return {
        label: "Open",
        backgroundColor: "rgba(27, 109, 36, 0.12)",
        textColor: colors.success,
      };
  }
}

export function ScholarshipCard({ scholarship, match, onPress }: Props) {
  const title = scholarship?.name ?? match?.scholarshipName ?? "";
  const provider = scholarship?.provider ?? match?.provider ?? "";
  const deadline = scholarship?.deadline ?? match?.deadline;
  const country = scholarship?.destinationCountry ?? match?.destinationCountry;
  const days = scholarship?.daysUntilDeadline;
  const field = scholarship?.eligibleFields;
  const imageUrl = scholarship?.imageUrl;
  const status = scholarship?.status;

  const countdownLabel = getCountdownLabel(days);
  const statusInfo = getStatusInfo(status, days);

  const statusBadge = (
    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: statusInfo.textColor }]}>
        {statusInfo.label}
      </Text>
    </View>
  );

  return (
    <BaseScholarshipCard
      title={title}
      provider={provider}
      deadline={deadline ? formatDeadline(deadline) : undefined}
      country={country}
      field={field}
      imageUrl={imageUrl}
      countdownLabel={countdownLabel}
      matchScore={match?.matchScore}
      onPress={onPress}
      statusBadge={statusBadge}
    />
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 11,
  },
});
