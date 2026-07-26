package com.scholarlinkgh;

import com.scholarlinkgh.entity.StudentProfile;
import org.junit.jupiter.api.Test;
import java.util.Map;
import org.springframework.http.ResponseEntity;

public class ProfileCompletenessTest {

    @Test
    public void testLogic() {
        StudentProfile profile = new StudentProfile();
        profile.setInstitution("Kwame Nkrumah University of Science and Technology ");
        profile.setFieldOfStudy("Computer Science");
        profile.setGpa(3.5);
        profile.setCountryPreference("UK");
        profile.setLanguageProficiency("English:Fluent");
        profile.setFinancialNeed("HIGH");

        int filledFields = 0;
        int totalFields = 6;
        String nextStep = "/profile-setup";

        boolean hasInstitution = profile.getInstitution() != null && !profile.getInstitution().isBlank();
        boolean hasField = profile.getFieldOfStudy() != null && !profile.getFieldOfStudy().isBlank();
        boolean hasGpa = profile.getGpa() != null;
        
        if (hasInstitution && hasField && hasGpa) {
            nextStep = "/profile-setup-step-2";
        }

        boolean hasCountry = profile.getCountryPreference() != null && !profile.getCountryPreference().isBlank();
        boolean hasFinancialNeed = profile.getFinancialNeed() != null && !profile.getFinancialNeed().isBlank();
        if (hasInstitution && hasField && hasGpa && hasCountry) {
            nextStep = "/profile-setup-step-3";
        }

        if (hasInstitution) filledFields++;
        if (hasField) filledFields++;
        if (hasGpa) filledFields++;
        if (hasCountry) filledFields++;
        if (hasFinancialNeed) filledFields++;
        
        boolean hasLanguage = profile.getLanguageProficiency() != null && !profile.getLanguageProficiency().isBlank();
        if (hasLanguage) filledFields++;

        if (filledFields == totalFields) {
            nextStep = "/profile-summary";
        }

        int percentage = (int) Math.round(((double) filledFields / totalFields) * 100);

        ResponseEntity<Map<String, Object>> response = ResponseEntity.ok(Map.of(
            "completeness", percentage,
            "next_step", nextStep
        ));
        
        System.out.println(response.getBody());
    }
}
