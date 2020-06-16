const
  jp = require('jsonpath'),
  parser = require("java-parser");

const javaParser = {

  checkParticularChildren(content, functionName, childName, throwIfError) {
    if (!content.children || !content.children[childName] || !Array.isArray(content.children[childName])) {
      let errorText = `[${functionName}] child ${childName} not found or not an array`;
      console.log(errorText);
      if (throwIfError) {
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    if (content.children[childName].length === 0) {
      let errorText = `[${functionName}] child ${childName} is empty`;
      console.log(errorText);
      if (throwIfError) {
        throw new Error(errorText);
      } else {
        return null;
      }
    }

    return content.children[childName];
  },

  checkParticularChild(content, functionName, childName, throwIfError) {
    let children = this.checkParticularChildren(content, functionName, childName, throwIfError);
    return children ? children[0] : null;
  },

  parseJavaContent(fileContent) {
    let content = parser.parse(fileContent);
    let classes = this.extractClassesInfo(content);
    return { status: 'success', content, classes };
  },

  getFirstClassDeclaration(content) {
    let ordinaryCompilationUnit = this.checkParticularChild(content, "getFirstClassDeclaration", "ordinaryCompilationUnit", true);
    // if (! content.children || !content.children.ordinaryCompilationUnit) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: no ordinaryCompilationUnit');
    //   return false;
    // }
    // if (! Array.isArray(content.children.ordinaryCompilationUnit)) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: ordinaryCompilationUnit is not an array');
    //   return false;
    // }
    // if (content.children.ordinaryCompilationUnit.length > 1) {
    //   console.warn('[getFirstClassDeclaration] Irregular Java file: ordinaryCompilationUnit size is greater than 1');
    // }

    let typeDeclaration = this.checkParticularChild(ordinaryCompilationUnit, "getFirstClassDeclaration", "typeDeclaration", true);
    // if (!content.children.ordinaryCompilationUnit[0].children.typeDeclaration){
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: ordinaryCompilationUnit.typeDeclaration not found');
    //   return false;
    // }
    // let typeDeclarations = content.children.ordinaryCompilationUnit[0].children.typeDeclaration;
    // if (! Array.isArray(typeDeclarations)) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: typeDeclaration is not an array');
    //   return false;
    // }
    // let typeDeclaration = typeDeclarations[0];
    let classDeclaration = this.checkParticularChild(typeDeclaration, "getFirstClassDeclaration", "classDeclaration", true);
    // if (!typeDeclaration || !typeDeclaration.children || !typeDeclaration.children.classDeclaration) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: classDeclaration not found');
    //   return false;
    // }
    // if (! Array.isArray(typeDeclaration.children.classDeclaration)) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: classDeclaration is not an array');
    //   return false;
    // }
    // if (typeDeclaration.children.classDeclaration.length === 0) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: classDeclaration is empty');
    //   return false;
    // }
    return classDeclaration;
  },

  extractClassAnnotationsInfo(typeDeclaration) {
    let modifiers = this.checkParticularChildren(typeDeclaration, "extractClassAnnotationsInfo", "classModifier", true);
    // if (!typeDeclaration.children || !typeDeclaration.children.classModifier || !Array.isArray(typeDeclaration.children.classModifier)) {
    //   console.log('[extractClassAnnotationsInfo] class modifiers not found');
    //   return;
    // }
    let annotationsInfo = [];
    // let modifiers = typeDeclaration.children.classModifier;
    for( let i=0; i < modifiers.length; i++) {
      let annotations = this.checkParticularChildren(modifiers[i], "extractClassAnnotationsInfo", "annotation", false);
      if (annotations) {
        for (let annIndex=0; annIndex < annotations.length; annIndex++) {
          let annotation = annotations[annIndex];
          let annotationInfo = this.extractAnnotationInfo(annotation);
          annotationsInfo.push(annotationInfo);
        }
      }
    }

    return annotationsInfo;
  },

  extractClassInfo(firstClassDeclaration) {
    let classInfo = {};
    classInfo.annotations = this.extractClassAnnotationsInfo(firstClassDeclaration);

    return classInfo;
  },

  extractClassesInfo(content) {
    let classesInfo = {};
    classesInfo.classes = [];

    let firstClassDeclaration = this.getFirstClassDeclaration(content)
    let classInfo = this.extractClassInfo(firstClassDeclaration);
    classesInfo.classes.push(classInfo);

    // let res = jp.query(content, '$..children.*[?(@.name=="typeIdentifier")]');


    return classesInfo;
  },
  extractAnnotationInfo(annotation) {
    let typeName = this.checkParticularChild(annotation, "extractAnnotationInfo", "typeName", true);
    // if (!annotation || !annotation.children || !annotation.children.typeName || !Array.isArray(annotation.children.typeName)) {
    //   console.log('[extractAnnotationInfo] Annotation typeName not valid');
    //   return false;
    // }
    // if (! Array.isArray(typeDeclaration.children.classDeclaration)) {
    //   console.log('[getFirstClassDeclaration] Not a regular Java file: classDeclaration is not an array');
    //   return false;
    // }
    // let typeName = annotation.children.typeName[0];
    let identifier = this.checkParticularChild(typeName, "extractAnnotationInfo", "Identifier", true);
    // if (!typeName || !typeName.children || !typeName.children.Identifier || !Array.isArray(annotation.children.Identifier)) {
    //   console.log('[extractAnnotationInfo] Annotation typeName not valid');
    //   return false;
    // }
    let annotationInfo = {
      name: identifier.image
    }

    // let name = annotation.children && annotation.children.Identifier && Array.isArray(annotation.children.Identifier) && annotation.children.Identifier.length > 0
    //   ? annotation.children.Identifier[0].image : null;
    return annotationInfo;


  }
};


module.exports = javaParser;
