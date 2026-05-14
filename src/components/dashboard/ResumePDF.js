import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    color: '#000000',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2 solid #000000',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000',
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  contactItem: {
    fontSize: 9,
    marginBottom: 4,
    color: '#000000',
    marginRight: 15,
    flexShrink: 0,
  },
  section: {
    marginBottom: 25,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000',
    textTransform: 'uppercase',
    borderBottom: '1 solid #cccccc',
    paddingBottom: 5,
  },
  item: {
    marginBottom: 20,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  itemLocation: {
    fontSize: 9,
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  itemDuration: {
    fontSize: 9,
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  description: {
    fontSize: 9,
    marginBottom: 5,
    lineHeight: 1.4,
    color: '#000000',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  skill: {
    fontSize: 8,
    color: '#000000',
    marginRight: 8,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
    padding: '2 6',
    borderRadius: 3,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  bulletText: {
    fontSize: 9,
    marginLeft: 8,
    flex: 1,
    color: '#000000',
    lineHeight: 1.4,
  },
  projectTech: {
    fontSize: 8,
    color: '#000000',
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    padding: '2 6',
    borderRadius: 3,
    marginTop: 5,
  },
  introduction: {
    fontSize: 10,
    marginBottom: 20,
    lineHeight: 1.4,
    color: '#000000',
    fontStyle: 'italic',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderLeft: '3 solid #000000',
  },
  skillsCategory: {
    marginBottom: 15,
  },
  skillsCategoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
    textTransform: 'uppercase',
  },
});


const ResumePDF = ({ resume }) => {
  if (!resume) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.name}>No Resume Data Available</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.personalInfo?.name || 'YOUR NAME'}</Text>
          <View style={styles.contactRow}>
            {resume.personalInfo?.email && (
              <Text style={styles.contactItem}>{resume.personalInfo.email}</Text>
            )}
            {resume.personalInfo?.phone && (
              <Text style={styles.contactItem}>{resume.personalInfo.phone}</Text>
            )}
            {resume.personalInfo?.location && (
              <Text style={styles.contactItem}>{resume.personalInfo.location}</Text>
            )}
            {resume.personalInfo?.linkedin && (
              <Text style={styles.contactItem}>{resume.personalInfo.linkedin}</Text>
            )}
            {resume.personalInfo?.github && (
              <Text style={styles.contactItem}>{resume.personalInfo.github}</Text>
            )}
          </View>
        </View>

        {/* Introduction/Summary */}
        {resume.introduction && resume.introduction.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.introduction}>{resume.introduction}</Text>
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemTitle}>{edu?.degree || 'Degree'}</Text>
                <Text style={styles.itemSubtitle}>{edu?.institution || 'School/University'}</Text>
                {edu?.field && (
                  <Text style={styles.itemLocation}>Field: {edu.field}</Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {edu?.startDate && (
                    <Text style={styles.itemDuration}>
                      {edu.startDate} {edu?.endDate && `- ${edu.endDate}`}
                    </Text>
                  )}
                  {edu?.gpa && (
                    <Text style={styles.description}>GPA: {edu.gpa}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {resume.experience.map((exp, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemTitle}>{exp?.position || 'Position'}</Text>
                <Text style={styles.itemSubtitle}>{exp?.company || 'Company'}</Text>
                {exp?.location && (
                  <Text style={styles.itemLocation}>📍 {exp.location}</Text>
                )}
                <Text style={styles.itemDuration}>
                  {exp?.startDate} {exp?.endDate && `- ${exp.endDate}`}
                </Text>
                {exp?.description && (
                  <View style={{ marginTop: 8 }}>
                    {exp.description.split('\n').filter(point => point.trim()).map((point, i) => (
                      <View key={i} style={styles.bulletPoint}>
                        <Text style={styles.bulletText}>• {point.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemTitle}>{project?.name || 'Project Name'}</Text>
                {project?.link && (
                  <Text style={styles.description}>🔗 {project.link}</Text>
                )}
                {project?.technologies && (
                  <Text style={styles.projectTech}>{project.technologies}</Text>
                )}
                {project?.description && (
                  <View style={{ marginTop: 8 }}>
                    {project.description.split('\n').filter(point => point.trim()).map((point, i) => (
                      <View key={i} style={styles.bulletPoint}>
                        <Text style={styles.bulletText}>• {point.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills Sections */}
        {resume.skillsSections && Object.values(resume.skillsSections).some(value => value && value.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {Object.entries(resume.skillsSections).map(([category, skills]) => {
              if (!skills || !skills.trim()) return null;
              
              // Handle both string and array formats
              const skillsArray = Array.isArray(skills) 
                ? skills.filter(skill => skill && skill.trim())
                : skills.split(',').map(s => s.trim()).filter(s => s);
              
              if (skillsArray.length === 0) return null;
              
              return (
                <View key={category} style={styles.skillsCategory}>
                  <Text style={styles.skillsCategoryTitle}>
                    {category === 'programmingLanguages' ? 'Programming Languages' :
                     category === 'webDevelopment' ? 'Web Development' :
                     category === 'coreConcepts' ? 'Core Concepts' :
                     category === 'softSkills' ? 'Soft Skills' :
                     category}
                  </Text>
                  <View style={styles.skills}>
                    {skillsArray.map((skill, index) => (
                      <Text key={index} style={styles.skill}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Skills (if no categorized skills) */}
        {(!resume.skillsSections || !Object.values(resume.skillsSections).some(value => value && value.trim())) && 
         resume.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skills}>
              {resume.skills.filter(skill => skill && skill.trim()).map((skill, index) => (
                <Text key={index} style={styles.skill}>
                  {skill.trim()}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;